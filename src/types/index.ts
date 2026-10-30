// Core Domain Models & Roles

export type UserRole = 'CITIZEN' | 'AUTHORITY' | 'REPAIR_TEAM';

export type ReportStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'AWAITING_APPROVAL'
  | 'REWORK_REQUIRED'
  | 'RESOLVED'
  | 'REJECTED';

export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'AWAITING_APPROVAL'
  | 'REWORK_REQUIRED'
  | 'RESOLVED';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'MEDIUM' | 'LOW';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  department?: string;
  unit?: string;
  avatarInitials: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn?: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password?: string;
  role?: UserRole;
}

export interface SignupRequest {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface BoundingBox {
  x: number; // percentage (0-100) or normalized (0-1)
  y: number;
  width: number;
  height: number;
  label: string;
  confidence?: number;
}

export interface AIDetectionResult {
  detected: boolean;
  confidence: number; // e.g. 0.94
  severityScore: SeverityLevel; // Estimated categorical risk
  boundingBoxes: BoundingBox[];
  surfaceAreaEstimateM2?: number;
  isModelConnected: boolean; // Flag to indicate whether connected to actual YOLO or sample
  detectedAt?: string;
  rawResponse?: unknown;
}

// Alias for AIDetectionResult matching backend specification
export type DetectionResult = AIDetectionResult;

export interface StatusHistoryEntry {
  status: ReportStatus;
  timestamp: string;
  note?: string;
  actorName: string;
}

export interface PotholeReport {
  id: string;
  trackingNumber: string; // e.g. PF-098
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  createdAt: string;
  updatedAt: string;
  location: GeoLocation;
  description: string;
  damageImageUrl: string;
  restoredImageUrl?: string;
  aiDetection?: AIDetectionResult;
  status: ReportStatus;
  statusHistory: StatusHistoryEntry[];
  assignedTeamId?: string;
  assignedTeamName?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  deadline?: string;
  workOrderNumber?: string; // e.g. WO-88421
  reworkNotes?: string;
}

export interface CreateReportInput {
  reporterId?: string;
  reporterName?: string;
  reporterEmail?: string;
  location: GeoLocation;
  description: string;
  damageImageUrl?: string;
  imageFile?: File;
  aiDetection?: AIDetectionResult;
}

export interface RepairEvidence {
  taskId: string;
  reportId: string;
  evidencePhotoUrl: string;
  evidenceFile?: File;
  repairNotes?: string;
  submittedBy: string;
  submittedAt: string;
}

export interface RepairTask {
  id: string; // workOrderNumber e.g. WO-88421
  reportId: string; // trackingNumber e.g. PF-098
  trackingNumber: string;
  assignedTeamId: string;
  assignedTeamName: string;
  status: TaskStatus;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  deadline?: string;
  instructions?: string;
  startedAt?: string;
  completedAt?: string;
  afterRepairPhotoUrl?: string;
  repairNotes?: string;
  reworkReason?: string;
  createdAt: string;
  location?: GeoLocation;
  damageImageUrl?: string;
}

export interface CreateTaskInput {
  reportId: string;
  trackingNumber: string;
  assignedTeamId: string;
  assignedTeamName: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  deadline?: string;
  instructions?: string;
  location?: GeoLocation;
  damageImageUrl?: string;
}

export interface VerifyReportInput {
  verified: boolean;
  reason?: string;
  actorName?: string;
}

export interface ReviewTaskInput {
  approved: boolean;
  reworkReason?: string;
  actorName?: string;
}

export interface NotificationEvent {
  event: string;
  workOrderId: string;
  reportId: string;
  actorName: string;
  timestamp: string;
  evidencePhotoUrl?: string;
  recipientEmail?: string;
}
