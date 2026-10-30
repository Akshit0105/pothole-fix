import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..models import NotificationEvent, Report, Task

def create_resolution_notification(
    db: Session,
    report: Report,
    task: Task,
    approver_name: str
) -> NotificationEvent:
    """
    Creates a persistent notification event in the database for the citizen reporter.
    Idempotent: prevents duplicate resolution notifications if one already exists for this report.
    """
    existing = db.query(NotificationEvent).filter(
        NotificationEvent.report_id == report.id,
        NotificationEvent.event_type == "MUNICIPAL_REPAIR_RESOLVED"
    ).first()

    if existing:
        return existing

    payload = {
        "event": "MUNICIPAL_REPAIR_RESOLVED",
        "reportId": report.id,
        "trackingNumber": report.tracking_number,
        "workOrderId": task.id,
        "recipientEmail": report.reporter.email if report.reporter else "citizen@community.org",
        "recipientName": report.reporter.name if report.reporter else "Civic Reporter",
        "location": report.address,
        "approvedBy": approver_name,
        "approvedAt": datetime.now(timezone.utc).isoformat(),
        "damageImageUrl": report.image_path,
        "restoredImageUrl": report.restored_image_path,
        "notice": "Road patch flush grade verified. Pothole officially certified resolved."
    }

    event = NotificationEvent(
        report_id=report.id,
        recipient_id=report.reporter_id,
        event_type="MUNICIPAL_REPAIR_RESOLVED",
        delivery_status="PREPARED", # Explicitly PREPARED; not marked DELIVERED until email worker sends it
        payload_json=json.dumps(payload),
    )

    db.add(event)
    db.commit()
    db.refresh(event)
    return event
