import type { SeverityLevel, ReportStatus } from './index';

export type RoadCategory =
  | 'NATIONAL_HIGHWAY'
  | 'STATE_HIGHWAY'
  | 'MAJOR_ARTERIAL'
  | 'COMMERCIAL_CORRIDOR'
  | 'URBAN_TRANSIT';

export type SponsorshipEligibility =
  | 'ELIGIBLE_VERIFIED'
  | 'PENDING_VERIFICATION'
  | 'ALREADY_SPONSORED'
  | 'REPAIR_COMPLETED';

export type SponsorshipStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CHANGES_REQUESTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED';

export interface CompanyPothole {
  id: string;
  trackingNumber: string;
  roadName: string;
  locationName: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  photoUrl: string;
  restoredPhotoUrl?: string;
  severity: SeverityLevel;
  roadCategory: RoadCategory;
  repairStatus: ReportStatus;
  eligibility: SponsorshipEligibility;
  authorityVerified: boolean;
  verifiedBy?: string;
  estimatedRepairCostINR: number;
  reportedDate: string;
  trafficVolume: 'EXTREME_HIGHWAY' | 'HEAVY_COMMERCIAL' | 'MODERATE_URBAN' | 'RESIDENTIAL';
  notes?: string;
  dimensions?: string;
}

export interface SponsorshipTimelineStage {
  stage: SponsorshipStatus;
  label: string;
  timestamp?: string;
  actorName?: string;
  description: string;
  completed: boolean;
  isCurrent?: boolean;
}

export interface CompletionEvidence {
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  inspectedBy: string;
  compactionAuditPass: boolean;
  completionDate: string;
  certificateId: string;
  notes?: string;
}

export interface SponsorshipRequest {
  id: string;
  companyId?: string;
  companyEmail?: string;
  companyName: string;
  csrInitiativeName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  taxExemptionRequested: boolean;
  potholeIds: string[];
  potholes: CompanyPothole[];
  totalEstimatedCostINR: number;
  proposedAmountINR: number;
  status: SponsorshipStatus;
  submittedAt: string;
  authorityReviewDate?: string;
  authorityReviewerName?: string;
  rejectionReason?: string;
  changesRequestedNotes?: string;
  assignedCrewName?: string;
  assignedCrewId?: string;
  completedAt?: string;
  notes?: string;
  authorityNotes?: string;
  partiallyApprovedPotholeIds?: string[];
  isFundsReceived?: boolean;
  timeline: SponsorshipTimelineStage[];
  completionEvidence?: CompletionEvidence;
}

export interface PotholeSponsorshipValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CompanyProfile {
  id: string;
  companyName: string;
  initiativeName: string;
  representativeName: string;
  email: string;
  phone: string;
  sector: string;
  csrBudgetINR: number;
  taxId: string;
}

export interface CompanyDashboardMetrics {
  totalEligibleCount: number;
  highSeverityCount: number;
  selectedCount: number;
  activeSponsorshipsCount: number;
  completedRepairsCount: number;
  totalCsrCommittedINR: number;
  commutersProtectedEstimate: number;
}
