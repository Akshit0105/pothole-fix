import random
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Request,
    Query,
)
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Task, Report, User, StatusHistory, RepairEvidence
from ..schemas import (
    TaskResponse,
    CreateTaskRequest,
    ReviewTaskRequest,
    ReviewTaskResponse,
    GeoLocationSchema,
    TaskEvidenceUpload,
)
from ..dependencies import get_current_user, require_role, require_roles
from ..services.storage import save_uploaded_image
from ..services.notifications import create_resolution_notification

router = APIRouter(prefix="/tasks", tags=["Work Orders & Tasks"])

def format_task_response(task: Task, request: Optional[Request] = None) -> TaskResponse:
    base_url = str(request.base_url).rstrip("/") if request else "http://localhost:8000"

    damage_url = task.report.image_path if task.report else None
    if damage_url and damage_url.startswith("/uploads/"):
        damage_url = f"{base_url}{damage_url}"

    # Get latest evidence if uploaded
    after_url = None
    if task.evidences:
        latest_evi = sorted(task.evidences, key=lambda x: x.uploaded_at or datetime.min, reverse=True)[0]
        after_url = latest_evi.image_path
        if after_url and after_url.startswith("/uploads/"):
            after_url = f"{base_url}{after_url}"

    location_data = None
    if task.report:
        location_data = GeoLocationSchema(
            latitude=task.report.latitude,
            longitude=task.report.longitude,
            address=task.report.address,
        )

    return TaskResponse(
        id=task.id,
        report_id=task.report_id,
        tracking_number=task.work_order_number, # or task.report.tracking_number
        assigned_team_id=task.assigned_team_id,
        assigned_team_name=task.assigned_team_name,
        status=task.status,
        priority=task.priority,
        deadline=task.deadline,
        instructions=task.instructions,
        started_at=task.started_at.isoformat() if task.started_at else None,
        completed_at=task.completed_at.isoformat() if task.completed_at else None,
        approved_at=task.approved_at.isoformat() if task.approved_at else None,
        after_repair_photo_url=after_url,
        repair_notes=task.evidences[0].notes if task.evidences else None,
        rework_reason=task.rework_reason,
        created_at=task.created_at.isoformat() if task.created_at else datetime.now(timezone.utc).isoformat(),
        location=location_data,
        damage_image_url=damage_url,
    )

def generate_work_order_id(db: Session) -> str:
    for _ in range(50):
        wo = f"WO-{random.randint(10000, 99999)}"
        if not db.query(Task).filter(Task.id == wo).first():
            return wo
    return f"WO-{int(datetime.now(timezone.utc).timestamp()) % 100000}"

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: CreateTaskRequest,
    request: Request,
    current_user: User = Depends(require_role("AUTHORITY")),
    db: Session = Depends(get_db),
):
    """
    POST /tasks
    Authority assigns a verified report to a repair crew.
    Only VERIFIED reports can be assigned.
    """
    report = db.query(Report).filter(
        (Report.id == payload.report_id) | (Report.tracking_number == payload.report_id)
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report #{payload.report_id} not found."
        )

    if report.status not in ["VERIFIED", "REWORK_REQUIRED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Report must be in 'VERIFIED' status before crew assignment. Current status: '{report.status}'."
        )

    wo_id = generate_work_order_id(db)
    team_name = payload.assigned_team_name or f"Unit {payload.assigned_team_id}"

    new_task = Task(
        id=wo_id,
        work_order_number=wo_id,
        report_id=report.id,
        assigned_team_id=payload.assigned_team_id,
        assigned_team_name=team_name,
        priority=payload.priority or "HIGH",
        deadline=payload.deadline or "Standard 24h SLA",
        instructions=payload.instructions or "Cold saw-cut perimeter, flush compaction, clean debris.",
        status="PENDING",
    )

    db.add(new_task)

    # Transition report status to ASSIGNED in same transaction
    report.status = "ASSIGNED"
    report.updated_at = datetime.now(timezone.utc)

    # Add history logs
    history = StatusHistory(
        report_id=report.id,
        task_id=new_task.id,
        actor_id=current_user.id,
        actor_name=current_user.name,
        status="ASSIGNED",
        note=f"Work Order #{wo_id} dispatched to {team_name}.",
    )
    db.add(history)

    db.commit()
    db.refresh(new_task)
    return format_task_response(new_task, request)

@router.get("/my", response_model=List[TaskResponse])
def get_my_tasks(
    request: Request,
    current_user: User = Depends(require_roles(["REPAIR_TEAM", "AUTHORITY"])),
    db: Session = Depends(get_db),
):
    """
    GET /tasks/my
    Returns tasks assigned to the authenticated repair team crew lead.
    """
    query = db.query(Task)
    if current_user.role == "REPAIR_TEAM" and current_user.team_id:
        query = query.filter(Task.assigned_team_id == current_user.team_id)

    tasks = query.order_by(Task.created_at.desc()).all()
    return [format_task_response(t, request) for t in tasks]

@router.get("", response_model=List[TaskResponse])
def list_all_tasks(
    request: Request,
    assigned_team_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_roles(["AUTHORITY", "REPAIR_TEAM"])),
    db: Session = Depends(get_db),
):
    """
    GET /tasks
    Lists work orders for management or filtered by crew.
    """
    query = db.query(Task)
    if assigned_team_id:
        query = query.filter(Task.assigned_team_id == assigned_team_id)
    if status_filter and status_filter != "ALL":
        query = query.filter(Task.status == status_filter)

    tasks = query.order_by(Task.created_at.desc()).all()
    return [format_task_response(t, request) for t in tasks]

@router.get("/{task_id}", response_model=TaskResponse)
def get_task_detail(
    task_id: str,
    request: Request,
    current_user: User = Depends(require_roles(["AUTHORITY", "REPAIR_TEAM"])),
    db: Session = Depends(get_db),
):
    """
    GET /tasks/{id}
    Retrieves work order details.
    """
    task = db.query(Task).filter(
        (Task.id == task_id) | (Task.work_order_number == task_id)
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work Order #{task_id} not found."
        )

    return format_task_response(task, request)

@router.patch("/{task_id}/start", response_model=TaskResponse)
def start_task(
    task_id: str,
    request: Request,
    current_user: User = Depends(require_role("REPAIR_TEAM")),
    db: Session = Depends(get_db),
):
    """
    PATCH /tasks/{id}/start
    Repair crew arrives on site and begins work.
    Transitions task and report to IN_PROGRESS.
    """
    task = db.query(Task).filter(
        (Task.id == task_id) | (Task.work_order_number == task_id)
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work Order #{task_id} not found."
        )

    if task.status not in ["PENDING", "REWORK_REQUIRED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start task in current status '{task.status}'."
        )

    task.status = "IN_PROGRESS"
    task.started_at = datetime.now(timezone.utc)

    # Sync report status
    if task.report:
        task.report.status = "IN_PROGRESS"
        task.report.updated_at = datetime.now(timezone.utc)

    history = StatusHistory(
        report_id=task.report_id,
        task_id=task.id,
        actor_id=current_user.id,
        actor_name=current_user.name,
        status="IN_PROGRESS",
        note="Crew arrived on site. Saw-cutting and compaction started.",
    )
    db.add(history)

    db.commit()
    db.refresh(task)
    return format_task_response(task, request)

@router.post("/{task_id}/completion", response_model=TaskResponse)
async def submit_completion_evidence(
    task_id: str,
    request: Request,
    file: Optional[UploadFile] = File(None),
    repair_notes: Optional[str] = Form(None),
    current_user: User = Depends(require_role("REPAIR_TEAM")),
    db: Session = Depends(get_db),
):
    """
    POST /tasks/{id}/completion
    Repair crew uploads after-repair compaction photograph.
    Transitions task and report to AWAITING_APPROVAL.
    """
    task = db.query(Task).filter(
        (Task.id == task_id) | (Task.work_order_number == task_id)
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work Order #{task_id} not found."
        )

    if task.status not in ["IN_PROGRESS", "REWORK_REQUIRED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit completion evidence for task in status '{task.status}'."
        )

    # Save evidence image (multipart or JSON fallback)
    saved_evidence_url: str = ""
    notes: str = repair_notes or "Compacted asphalt patch flush with driving grade."

    if file is not None:
        saved_evidence_url = await save_uploaded_image(file, prefix="evidence")
    else:
        try:
            body = await request.json()
            payload = TaskEvidenceUpload(**body)
            saved_evidence_url = payload.after_repair_photo_url or "/uploads/default_evidence.jpg"
            if payload.repair_notes:
                notes = payload.repair_notes
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="After-repair photograph is required to submit for approval."
            )

    # Create RepairEvidence
    evidence = RepairEvidence(
        task_id=task.id,
        image_path=saved_evidence_url,
        notes=notes,
        uploaded_by_id=current_user.id,
    )
    db.add(evidence)

    # Update task status
    task.status = "AWAITING_APPROVAL"
    task.completed_at = datetime.now(timezone.utc)

    # Update linked report status
    if task.report:
        task.report.status = "AWAITING_APPROVAL"
        task.report.restored_image_path = saved_evidence_url
        task.report.rework_notes = notes
        task.report.updated_at = datetime.now(timezone.utc)

    history = StatusHistory(
        report_id=task.report_id,
        task_id=task.id,
        actor_id=current_user.id,
        actor_name=current_user.name,
        status="AWAITING_APPROVAL",
        note=f"Post-repair evidence submitted: {notes}",
    )
    db.add(history)

    db.commit()
    db.refresh(task)
    return format_task_response(task, request)

@router.patch("/{task_id}/review", response_model=ReviewTaskResponse)
def review_task(
    task_id: str,
    payload: ReviewTaskRequest,
    request: Request,
    current_user: User = Depends(require_role("AUTHORITY")),
    db: Session = Depends(get_db),
):
    """
    PATCH /tasks/{id}/review
    Authority inspects before/after photos: Approves or Requests Rework.
    """
    task = db.query(Task).filter(
        (Task.id == task_id) | (Task.work_order_number == task_id)
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work Order #{task_id} not found."
        )

    if task.status != "AWAITING_APPROVAL":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review task in status '{task.status}'. Must be 'AWAITING_APPROVAL'."
        )

    notification_payload = None

    if payload.approved:
        # APPROVAL FLOW
        task.status = "RESOLVED"
        task.approved_at = datetime.now(timezone.utc)

        if task.report:
            task.report.status = "RESOLVED"
            task.report.updated_at = datetime.now(timezone.utc)

        history = StatusHistory(
            report_id=task.report_id,
            task_id=task.id,
            actor_id=current_user.id,
            actor_name=current_user.name,
            status="RESOLVED",
            note="Level-1 flush pass certified. Work order officially resolved.",
        )
        db.add(history)

        # Create persistent NotificationEvent (Section 7)
        notif = create_resolution_notification(
            db=db,
            report=task.report,
            task=task,
            approver_name=current_user.name
        )
        notification_payload = {
            "event": notif.event_type,
            "workOrderId": task.id,
            "reportId": task.report_id,
            "approvedBy": current_user.name,
            "approvedAt": task.approved_at.isoformat(),
            "deliveryStatus": notif.delivery_status
        }
    else:
        # REWORK FLOW
        if not payload.rework_reason or not payload.rework_reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejection and rework requests require an explicit explanation reason."
            )

        task.status = "REWORK_REQUIRED"
        task.rework_reason = payload.rework_reason.strip()

        if task.report:
            task.report.status = "REWORK_REQUIRED"
            task.report.rework_notes = payload.rework_reason.strip()
            task.report.updated_at = datetime.now(timezone.utc)

        history = StatusHistory(
            report_id=task.report_id,
            task_id=task.id,
            actor_id=current_user.id,
            actor_name=current_user.name,
            status="REWORK_REQUIRED",
            note=f"Authority requested rework: {payload.rework_reason.strip()}",
        )
        db.add(history)

    db.commit()
    db.refresh(task)

    return ReviewTaskResponse(
        task=format_task_response(task, request),
        notification_payload=notification_payload
    )
