from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
    Integer,
    Boolean,
)
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="CITIZEN") # CITIZEN, AUTHORITY, REPAIR_TEAM
    team_id = Column(String(50), nullable=True) # e.g. team-04
    unit = Column(String(100), nullable=True) # e.g. Asphalt Unit 04
    title = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    avatar_initials = Column(String(10), nullable=False, default="CR")
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    reports = relationship("Report", back_populates="reporter")
    notifications = relationship("NotificationEvent", back_populates="recipient")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(50), primary_key=True) # e.g. PF-101
    tracking_number = Column(String(50), unique=True, index=True, nullable=False)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(30), nullable=False, default="LOW") # CRITICAL, HIGH, MODERATE, LOW
    ai_status = Column(String(30), nullable=False, default="UNAVAILABLE") # PENDING, VERIFIED, UNAVAILABLE
    ai_detection_json = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="SUBMITTED")
    restored_image_path = Column(String(500), nullable=True)
    rework_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    reporter = relationship("User", back_populates="reports")
    tasks = relationship("Task", back_populates="report", cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="report", cascade="all, delete-orphan")
    notifications = relationship("NotificationEvent", back_populates="report", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(50), primary_key=True) # e.g. WO-88421
    work_order_number = Column(String(50), unique=True, index=True, nullable=False)
    report_id = Column(String(50), ForeignKey("reports.id"), nullable=False)
    assigned_team_id = Column(String(50), nullable=False) # e.g. team-04
    assigned_team_name = Column(String(150), nullable=False)
    priority = Column(String(20), nullable=False, default="HIGH") # HIGH, MEDIUM, LOW
    deadline = Column(String(100), nullable=True)
    instructions = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="PENDING") # PENDING, IN_PROGRESS, AWAITING_APPROVAL, REWORK_REQUIRED, RESOLVED
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rework_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    report = relationship("Report", back_populates="tasks")
    evidences = relationship("RepairEvidence", back_populates="task", cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="task", cascade="all, delete-orphan")

class RepairEvidence(Base):
    __tablename__ = "repair_evidence"

    id = Column(String, primary_key=True, default=generate_uuid)
    task_id = Column(String(50), ForeignKey("tasks.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    notes = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=utc_now)
    uploaded_by_id = Column(String, ForeignKey("users.id"), nullable=True)

    # Relationships
    task = relationship("Task", back_populates="evidences")

class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(String(50), ForeignKey("reports.id"), nullable=True)
    task_id = Column(String(50), ForeignKey("tasks.id"), nullable=True)
    actor_id = Column(String, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(100), nullable=False)
    status = Column(String(30), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    report = relationship("Report", back_populates="status_history")
    task = relationship("Task", back_populates="status_history")

class NotificationEvent(Base):
    __tablename__ = "notification_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String(50), ForeignKey("reports.id"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.id"), nullable=False)
    event_type = Column(String(50), nullable=False) # e.g. MUNICIPAL_REPAIR_RESOLVED
    delivery_status = Column(String(30), nullable=False, default="PREPARED") # PREPARED, QUEUED, DELIVERED
    payload_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    report = relationship("Report", back_populates="notifications")
    recipient = relationship("User", back_populates="notifications")
