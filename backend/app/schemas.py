from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Base Configuration ---
class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

# --- User & Auth Schemas ---
class UserBase(CamelModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "CITIZEN"

class UserLogin(CamelModel):
    email: str
    password: str

class UserResponse(CamelModel):
    id: str
    name: str
    email: str
    role: str
    avatar_initials: str = Field(..., serialization_alias="avatarInitials")
    title: Optional[str] = None
    department: Optional[str] = None
    unit: Optional[str] = None
    team_id: Optional[str] = Field(None, serialization_alias="teamId")

class AuthResponse(CamelModel):
    token: str
    token_type: str = Field("Bearer", serialization_alias="tokenType")
    expires_in: int = Field(86400, serialization_alias="expiresIn")
    user: UserResponse

# --- Geographic & AI Schemas ---
class GeoLocationSchema(CamelModel):
    latitude: float
    longitude: float
    address: str

class BoundingBoxSchema(CamelModel):
    x: float
    y: float
    width: float
    height: float
    label: str
    confidence: Optional[float] = None

class AIDetectionSchema(CamelModel):
    detected: bool
    confidence: float
    severity_score: str = Field(..., serialization_alias="severityScore")
    bounding_boxes: List[BoundingBoxSchema] = Field(default_factory=list, serialization_alias="boundingBoxes")
    is_model_connected: bool = Field(False, serialization_alias="isModelConnected")
    detected_at: Optional[str] = Field(None, serialization_alias="detectedAt")

class AIDetectionResponse(CamelModel):
    detected: bool = False
    confidence: float = 0.0
    severity: str = "LOW"
    boxes: List[BoundingBoxSchema] = Field(default_factory=list)
    status: str = "AI_UNAVAILABLE"
    message: str = "AI model offline. No fabricated bounding boxes generated."
    is_model_connected: bool = Field(False, serialization_alias="isModelConnected")

# --- Report Schemas ---
class StatusHistorySchema(CamelModel):
    status: str
    timestamp: str
    note: Optional[str] = None
    actor_name: str = Field(..., serialization_alias="actorName")

class CreateReportJson(CamelModel):
    location: GeoLocationSchema
    description: str
    damage_image_url: Optional[str] = None
    ai_detection: Optional[Dict[str, Any]] = None

class VerifyReportRequest(CamelModel):
    verified: bool
    reason: Optional[str] = None

class ReportResponse(CamelModel):
    id: str
    tracking_number: str = Field(..., serialization_alias="trackingNumber")
    reporter_id: str = Field(..., serialization_alias="reporterId")
    reporter_name: Optional[str] = Field(None, serialization_alias="reporterName")
    reporter_email: Optional[str] = Field(None, serialization_alias="reporterEmail")
    created_at: str = Field(..., serialization_alias="createdAt")
    updated_at: str = Field(..., serialization_alias="updatedAt")
    location: GeoLocationSchema
    description: str
    damage_image_url: str = Field(..., serialization_alias="damageImageUrl")
    restored_image_url: Optional[str] = Field(None, serialization_alias="restoredImageUrl")
    ai_detection: Optional[Dict[str, Any]] = Field(None, serialization_alias="aiDetection")
    status: str
    status_history: List[StatusHistorySchema] = Field(default_factory=list, serialization_alias="statusHistory")
    priority: Optional[str] = None
    deadline: Optional[str] = None
    work_order_number: Optional[str] = Field(None, serialization_alias="workOrderNumber")
    assigned_team_id: Optional[str] = Field(None, serialization_alias="assignedTeamId")
    assigned_team_name: Optional[str] = Field(None, serialization_alias="assignedTeamName")
    rework_notes: Optional[str] = Field(None, serialization_alias="reworkNotes")

# --- Task Schemas ---
class CreateTaskRequest(CamelModel):
    report_id: str
    tracking_number: Optional[str] = None
    assigned_team_id: str
    assigned_team_name: Optional[str] = None
    priority: str = "HIGH"
    deadline: Optional[str] = None
    instructions: Optional[str] = None

class TaskEvidenceUpload(CamelModel):
    after_repair_photo_url: Optional[str] = None
    repair_notes: Optional[str] = None

class ReviewTaskRequest(CamelModel):
    approved: bool
    rework_reason: Optional[str] = None

class TaskResponse(CamelModel):
    id: str
    report_id: str = Field(..., serialization_alias="reportId")
    tracking_number: str = Field(..., serialization_alias="trackingNumber")
    assigned_team_id: str = Field(..., serialization_alias="assignedTeamId")
    assigned_team_name: str = Field(..., serialization_alias="assignedTeamName")
    status: str
    priority: str
    deadline: Optional[str] = None
    instructions: Optional[str] = None
    started_at: Optional[str] = Field(None, serialization_alias="startedAt")
    completed_at: Optional[str] = Field(None, serialization_alias="completedAt")
    approved_at: Optional[str] = Field(None, serialization_alias="approvedAt")
    after_repair_photo_url: Optional[str] = Field(None, serialization_alias="afterRepairPhotoUrl")
    repair_notes: Optional[str] = Field(None, serialization_alias="repairNotes")
    rework_reason: Optional[str] = Field(None, serialization_alias="reworkReason")
    created_at: str = Field(..., serialization_alias="createdAt")
    location: Optional[GeoLocationSchema] = None
    damage_image_url: Optional[str] = Field(None, serialization_alias="damageImageUrl")

class ReviewTaskResponse(CamelModel):
    task: TaskResponse
    notification_payload: Optional[Dict[str, Any]] = Field(None, serialization_alias="notificationPayload")
