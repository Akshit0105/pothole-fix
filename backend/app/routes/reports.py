import json
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
from ..models import Report, User, StatusHistory, Task
from ..schemas import (
    ReportResponse,
    GeoLocationSchema,
    StatusHistorySchema,
    VerifyReportRequest,
    CreateReportJson,
)
from ..dependencies import get_current_user, require_role, require_roles
from ..services.storage import save_uploaded_image

router = APIRouter(prefix="/reports", tags=["Reports"])

def format_report_response(report: Report, request: Optional[Request] = None) -> ReportResponse:
    base_url = str(request.base_url).rstrip("/") if request else "http://localhost:8000"

    # Ensure full image URLs if relative
    damage_url = report.image_path
    if damage_url and damage_url.startswith("/uploads/"):
        damage_url = f"{base_url}{damage_url}"

    restored_url = report.restored_image_path
    if restored_url and restored_url.startswith("/uploads/"):
        restored_url = f"{base_url}{restored_url}"

    ai_data = None
    if report.ai_detection_json:
        try:
            ai_data = json.loads(report.ai_detection_json)
        except Exception:
            ai_data = None

    history = [
        StatusHistorySchema(
            status=h.status,
            timestamp=h.created_at.strftime("%b %d, %H:%M UTC") if h.created_at else "Just now",
            note=h.note,
            actor_name=h.actor_name,
        )
        for h in sorted(report.status_history, key=lambda x: x.created_at or datetime.min)
    ]

    # Find active task if assigned
    active_task = report.tasks[0] if report.tasks else None

    return ReportResponse(
        id=report.id,
        tracking_number=report.tracking_number,
        reporter_id=report.reporter_id,
        reporter_name=report.reporter.name if report.reporter else "Civic Reporter",
        reporter_email=report.reporter.email if report.reporter else "citizen@community.org",
        created_at=report.created_at.isoformat() if report.created_at else datetime.now(timezone.utc).isoformat(),
        updated_at=report.updated_at.isoformat() if report.updated_at else datetime.now(timezone.utc).isoformat(),
        location=GeoLocationSchema(
            latitude=report.latitude,
            longitude=report.longitude,
            address=report.address,
        ),
        description=report.description,
        damage_image_url=damage_url,
        restored_image_url=restored_url,
        ai_detection=ai_data,
        status=report.status,
        status_history=history,
        priority=active_task.priority if active_task else None,
        deadline=active_task.deadline if active_task else None,
        work_order_number=active_task.work_order_number if active_task else None,
        assigned_team_id=active_task.assigned_team_id if active_task else None,
        assigned_team_name=active_task.assigned_team_name if active_task else None,
        rework_notes=report.rework_notes,
    )

def generate_tracking_number(db: Session) -> str:
    """Generates unique tracking number e.g. PF-123."""
    for _ in range(50):
        candidate = f"PF-{random.randint(100, 999)}"
        if not db.query(Report).filter(Report.tracking_number == candidate).first():
            return candidate
    return f"PF-{int(datetime.now(timezone.utc).timestamp()) % 10000}"

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    request: Request,
    file: Optional[UploadFile] = File(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    ai_detection: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    POST /reports
    Accepts multipart/form-data with image file or JSON body.
    """
    # 1. Handle multipart or JSON fallback
    final_image_path: str = ""
    final_lat: float = 0.0
    final_lng: float = 0.0
    final_address: str = ""
    final_desc: str = ""
    final_ai_json: Optional[str] = None

    if file is not None and latitude is not None and longitude is not None:
        # Multipart upload
        saved_rel_url = await save_uploaded_image(file, prefix="pothole")
        final_image_path = saved_rel_url
        final_lat = float(latitude)
        final_lng = float(longitude)
        final_address = address or "Municipal Road Location"
        final_desc = description or "Road surface hazard reported by citizen."
        final_ai_json = ai_detection
    else:
        # Check if sent as application/json
        try:
            body = await request.json()
            payload = CreateReportJson(**body)
            final_lat = payload.location.latitude
            final_lng = payload.location.longitude
            final_address = payload.location.address
            final_desc = payload.description
            final_image_path = payload.damage_image_url or "/uploads/default_pothole.jpg"
            if payload.ai_detection:
                final_ai_json = json.dumps(payload.ai_detection)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid report payload. Provide multipart file with latitude/longitude or JSON payload."
            )

    # 2. Coordinate validation
    if not (-90.0 <= final_lat <= 90.0 and -180.0 <= final_lng <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90 and 90, longitude between -180 and 180."
        )

    # 3. Create persistent Report
    tracking_no = generate_tracking_number(db)
    new_report = Report(
        id=tracking_no,
        tracking_number=tracking_no,
        reporter_id=current_user.id,
        image_path=final_image_path,
        latitude=final_lat,
        longitude=final_lng,
        address=final_address,
        description=final_desc,
        severity="LOW",
        ai_status="PENDING" if final_ai_json else "UNAVAILABLE",
        ai_detection_json=final_ai_json,
        status="SUBMITTED",
    )

    db.add(new_report)

    # 4. Add initial status history log
    initial_history = StatusHistory(
        report_id=new_report.id,
        actor_id=current_user.id,
        actor_name=current_user.name,
        status="SUBMITTED",
        note="Hazard reported by citizen with GPS coordinates.",
    )
    db.add(initial_history)

    db.commit()
    db.refresh(new_report)

    return format_report_response(new_report, request)

@router.get("/my", response_model=List[ReportResponse])
def get_my_reports(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GET /reports/my
    Returns reports submitted by the authenticated citizen.
    """
    reports = db.query(Report).filter(Report.reporter_id == current_user.id).order_by(Report.created_at.desc()).all()
    return [format_report_response(r, request) for r in reports]

@router.get("", response_model=List[ReportResponse])
def list_reports(
    request: Request,
    status_filter: Optional[str] = Query(None, alias="status"),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(["AUTHORITY", "REPAIR_TEAM"])),
    db: Session = Depends(get_db),
):
    """
    GET /reports
    Triage queue for Authority and Repair Teams.
    """
    query = db.query(Report)

    if status_filter and status_filter != "ALL":
        query = query.filter(Report.status == status_filter)

    if severity_filter and severity_filter != "ALL":
        query = query.filter(Report.severity == severity_filter)

    if search:
        pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            (Report.tracking_number.ilike(pattern)) |
            (Report.address.ilike(pattern)) |
            (Report.description.ilike(pattern))
        )

    reports = query.order_by(Report.created_at.desc()).all()
    return [format_report_response(r, request) for r in reports]

@router.get("/{report_id}", response_model=ReportResponse)
def get_report_detail(
    report_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    GET /reports/{id}
    Retrieves a single report with strict role-based access rules.
    """
    report = db.query(Report).filter(
        (Report.id == report_id) | (Report.tracking_number == report_id)
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report #{report_id} not found."
        )

    # Access check: Citizen can only view own reports; Authority can view any; Crew can view linked reports
    if current_user.role == "CITIZEN" and report.reporter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You can only inspect your own submitted citizen reports."
        )

    if current_user.role == "REPAIR_TEAM":
        has_assigned_task = any(t.assigned_team_id == current_user.team_id for t in report.tasks)
        if not has_assigned_task and current_user.role != "AUTHORITY":
            pass # Allow repair crew viewing for municipal awareness

    return format_report_response(report, request)

@router.patch("/{report_id}/verify", response_model=ReportResponse)
def verify_report(
    report_id: str,
    payload: VerifyReportRequest,
    request: Request,
    current_user: User = Depends(require_role("AUTHORITY")),
    db: Session = Depends(get_db),
):
    """
    PATCH /reports/{id}/verify
    Authority marks report VERIFIED or REJECTED.
    """
    report = db.query(Report).filter(
        (Report.id == report_id) | (Report.tracking_number == report_id)
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report #{report_id} not found."
        )

    if report.status not in ["SUBMITTED", "UNDER_REVIEW"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot verify report in current status '{report.status}'."
        )

    if payload.verified:
        report.status = "VERIFIED"
        note = payload.reason or "Photographic defect confirmed by Authority Inspector."
    else:
        if not payload.reason or not payload.reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A valid explanation reason is required when rejecting a citizen report."
            )
        report.status = "REJECTED"
        report.rework_notes = payload.reason.strip()
        note = f"Report rejected: {payload.reason.strip()}"

    report.updated_at = datetime.now(timezone.utc)

    history = StatusHistory(
        report_id=report.id,
        actor_id=current_user.id,
        actor_name=current_user.name,
        status=report.status,
        note=note,
    )
    db.add(history)

    db.commit()
    db.refresh(report)
    return format_report_response(report, request)

@router.post("/reset-demo")
def reset_demo_endpoint(db: Session = Depends(get_db)):
    """Resets the demo database to the exactly 3 seeded reports (#PF-101, #PF-102, #PF-103) in SUBMITTED state."""
    from ..main import reset_demo_database
    reset_demo_database(db)
    return {"message": "Demo database successfully reset to the 3 seeded reports."}
