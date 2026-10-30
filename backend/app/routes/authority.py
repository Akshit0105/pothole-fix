from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Task, User
from ..schemas import TaskResponse
from ..dependencies import require_role
from .tasks import format_task_response

router = APIRouter(prefix="/authority", tags=["Authority Operations"])

@router.get("/approvals", response_model=List[TaskResponse])
def get_approvals_queue(
    request: Request,
    current_user: User = Depends(require_role("AUTHORITY")),
    db: Session = Depends(get_db),
):
    """
    GET /authority/approvals
    Returns tasks awaiting municipal inspection and before/after verification.
    """
    tasks = db.query(Task).filter(Task.status == "AWAITING_APPROVAL").order_by(Task.completed_at.desc()).all()
    return [format_task_response(t, request) for t in tasks]

@router.get("/tasks", response_model=List[TaskResponse])
def get_authority_tasks(
    request: Request,
    current_user: User = Depends(require_role("AUTHORITY")),
    db: Session = Depends(get_db),
):
    """
    GET /authority/tasks
    """
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    return [format_task_response(t, request) for t in tasks]
