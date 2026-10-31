import { API_BASE_URL } from './apiClient';
import type {
  CompanyPothole,
  SponsorshipRequest,
  CompanyProfile,
  CompanyDashboardMetrics,
} from '../types/company';

const STORAGE_KEY_POTHOLES = 'potholefix_company_potholes_v1';
const STORAGE_KEY_REQUESTS = 'potholefix_company_requests_v1';
const STORAGE_KEY_PROFILE = 'potholefix_company_profile_v1';

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  id: 'comp-tata-csr-01',
  companyName: 'Tata Motors CSR Infrastructure Wing',
  initiativeName: 'Suraksha Marg: Indian Highway Resilience Pledge',
  representativeName: 'Vikramaditya Sengupta',
  email: 'csr.roads@tatamotors.com',
  phone: '+91 98140 22341',
  sector: 'Automotive & Commercial Vehicles',
  csrBudgetINR: 5000000, // 50 Lakhs INR
  taxId: 'AAACT2784F',
};

export const INITIAL_COMPANY_POTHOLES: CompanyPothole[] = [
  {
    id: 'PF-101',
    trackingNumber: 'PF-101',
    roadName: 'Sector 17 Commercial Corridor',
    locationName: 'Sector 17 Plaza Transit Spine, Chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh UT',
    lat: 30.7398,
    lng: 76.7827,
    photoUrl: '/photos/pothole-sector17.jpg',
    restoredPhotoUrl: '/photos/pothole-restored1.jpg',
    severity: 'CRITICAL',
    roadCategory: 'COMMERCIAL_CORRIDOR',
    repairStatus: 'ASSIGNED',
    eligibility: 'ELIGIBLE_VERIFIED',
    authorityVerified: true,
    verifiedBy: 'Alice Sharma (Commissioner)',
    estimatedRepairCostINR: 28500,
    reportedDate: 'Oct 28, 2026',
    trafficVolume: 'HEAVY_COMMERCIAL',
    dimensions: '1.4m × 1.1m × 95mm deep',
    notes: 'Severe asphalt crater along major city-center pedestrian and bus boarding concourse.',
  },
  {
    id: 'PF-102',
    trackingNumber: 'PF-102',
    roadName: 'Madhya Marg Arterial',
    locationName: 'Sector 26 Grain Market Corridor, Chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh UT',
    lat: 30.7290,
    lng: 76.8040,
    photoUrl: '/photos/pothole-madhyamarg.jpg',
    restoredPhotoUrl: '/photos/pothole-restored2.jpg',
    severity: 'HIGH',
    roadCategory: 'MAJOR_ARTERIAL',
    repairStatus: 'IN_PROGRESS',
    eligibility: 'ELIGIBLE_VERIFIED',
    authorityVerified: true,
    verifiedBy: 'Alice Sharma (Commissioner)',
    estimatedRepairCostINR: 34000,
    reportedDate: 'Oct 29, 2026',
    trafficVolume: 'EXTREME_HIGHWAY',
    dimensions: '2.1m × 0.9m × 80mm deep',
    notes: 'High-speed carriageway fatigue cracking causing dangerous vehicular swerving.',
  },
  {
    id: 'PF-103',
    trackingNumber: 'PF-103',
    roadName: 'National Highway 5 Corridor',
    locationName: 'NH-5 Kharar Flyover Western Link, Punjab',
    city: 'Kharar',
    state: 'Punjab',
    lat: 30.7499,
    lng: 76.6433,
    photoUrl: '/photos/pothole-kharar.jpg',
    restoredPhotoUrl: '/photos/pothole-restored3.jpg',
    severity: 'MEDIUM',
    roadCategory: 'NATIONAL_HIGHWAY',
    repairStatus: 'AWAITING_APPROVAL',
    eligibility: 'ELIGIBLE_VERIFIED',
    authorityVerified: true,
    verifiedBy: 'Punjab PWD Inspection Squad',
    estimatedRepairCostINR: 42000,
    reportedDate: 'Oct 30, 2026',
    trafficVolume: 'EXTREME_HIGHWAY',
    dimensions: '1.8m × 1.2m × 60mm deep',
    notes: 'Heavy commercial freight corridor depression requiring high-durability hot-mix compaction.',
  },
  {
    id: 'PF-204',
    trackingNumber: 'PF-204',
    roadName: 'Himalaya Marg Arterial',
    locationName: 'Sector 22 Market Transit Junction, Chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh UT',
    lat: 30.7315,
    lng: 76.7725,
    photoUrl: '/photos/pothole-sector17.jpg',
    severity: 'CRITICAL',
    roadCategory: 'MAJOR_ARTERIAL',
    repairStatus: 'VERIFIED',
    eligibility: 'ELIGIBLE_VERIFIED',
    authorityVerified: true,
    verifiedBy: 'Alice Sharma (Commissioner)',
    estimatedRepairCostINR: 26000,
    reportedDate: 'Oct 30, 2026',
    trafficVolume: 'HEAVY_COMMERCIAL',
    dimensions: '1.1m × 0.9m × 90mm deep',
    notes: 'Deep edge failure near bus rapid transit stop with continuous two-wheeler exposure.',
  },
  {
    id: 'PF-205',
    trackingNumber: 'PF-205',
    roadName: 'Mohali State Highway 12 Expressway',
    locationName: 'Phase 7 Industrial Outer Ring, Mohali',
    city: 'Mohali',
    state: 'Punjab',
    lat: 30.7046,
    lng: 76.7179,
    photoUrl: '/photos/pothole-madhyamarg.jpg',
    severity: 'HIGH',
    roadCategory: 'STATE_HIGHWAY',
    repairStatus: 'VERIFIED',
    eligibility: 'ELIGIBLE_VERIFIED',
    authorityVerified: true,
    verifiedBy: 'Punjab PWD Unit 04',
    estimatedRepairCostINR: 38000,
    reportedDate: 'Oct 29, 2026',
    trafficVolume: 'EXTREME_HIGHWAY',
    dimensions: '2.4m × 1.5m × 75mm deep',
    notes: 'High-speed interstate transit route linking IT corridor to international airport road.',
  },
  {
    id: 'PF-301',
    trackingNumber: 'PF-301',
    roadName: 'Dakshin Marg Ring Road',
    locationName: 'Sector 34 Exhibition Ground Approach, Chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh UT',
    lat: 30.7225,
    lng: 76.7680,
    photoUrl: '/photos/pothole-kharar.jpg',
    severity: 'HIGH',
    roadCategory: 'MAJOR_ARTERIAL',
    repairStatus: 'VERIFIED',
    eligibility: 'ELIGIBLE_VERIFIED',
    authorityVerified: true,
    verifiedBy: 'Alice Sharma (Commissioner)',
    estimatedRepairCostINR: 31000,
    reportedDate: 'Oct 30, 2026',
    trafficVolume: 'HEAVY_COMMERCIAL',
    dimensions: '1.6m × 1.0m × 85mm deep',
    notes: 'Multi-lane intersection approach crater with heavy peak rush-hour braking hazard.',
  },
  {
    id: 'PF-302',
    trackingNumber: 'PF-302',
    roadName: 'Vikas Marg Industrial Spine',
    locationName: 'Industrial Area Phase 1 Freight Link, Chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh UT',
    lat: 30.7120,
    lng: 76.7990,
    photoUrl: '/photos/pothole-sector17.jpg',
    severity: 'MODERATE',
    roadCategory: 'COMMERCIAL_CORRIDOR',
    repairStatus: 'VERIFIED',
    eligibility: 'ELIGIBLE_VERIFIED',
    authorityVerified: true,
    verifiedBy: 'Alice Sharma (Commissioner)',
    estimatedRepairCostINR: 22000,
    reportedDate: 'Oct 28, 2026',
    trafficVolume: 'HEAVY_COMMERCIAL',
    dimensions: '0.9m × 0.8m × 50mm deep',
    notes: 'Moderate surface depression along heavy cargo transit corridor.',
  },
  {
    id: 'PF-401',
    trackingNumber: 'PF-401',
    roadName: 'Zirakpur Highway Bypass Connector',
    locationName: 'NH-7 / NH-152 Junction Toll Expressway, Punjab',
    city: 'Zirakpur',
    state: 'Punjab',
    lat: 30.6420,
    lng: 76.8180,
    photoUrl: '/photos/pothole-kharar.jpg',
    severity: 'CRITICAL',
    roadCategory: 'NATIONAL_HIGHWAY',
    repairStatus: 'SUBMITTED',
    eligibility: 'PENDING_VERIFICATION',
    authorityVerified: false,
    estimatedRepairCostINR: 48000,
    reportedDate: 'Oct 31, 2026',
    trafficVolume: 'EXTREME_HIGHWAY',
    dimensions: '2.8m × 1.6m × 110mm deep',
    notes: 'Citizen-flagged highway crater. Awaiting Municipal Authority field triage before CSR eligibility confirmation.',
  },
  {
    id: 'PF-402',
    trackingNumber: 'PF-402',
    roadName: 'Panchkula Arterial Ring Road',
    locationName: 'MDC Sector 5 Interstate Link, Haryana Border',
    city: 'Panchkula',
    state: 'Haryana',
    lat: 30.7090,
    lng: 76.8520,
    photoUrl: '/photos/pothole-madhyamarg.jpg',
    severity: 'MEDIUM',
    roadCategory: 'STATE_HIGHWAY',
    repairStatus: 'SUBMITTED',
    eligibility: 'PENDING_VERIFICATION',
    authorityVerified: false,
    estimatedRepairCostINR: 25000,
    reportedDate: 'Oct 31, 2026',
    trafficVolume: 'MODERATE_URBAN',
    dimensions: '1.2m × 0.7m × 55mm deep',
    notes: 'Under municipal survey. Requires authority inspection sign-off prior to CSR sponsorship.',
  },
  {
    id: 'PF-999',
    trackingNumber: 'PF-999',
    roadName: 'Sector 17 Plaza West Wing',
    locationName: 'Sector 17 Commercial Corridor, Chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh UT',
    lat: 30.7414,
    lng: 76.7921,
    photoUrl: '/photos/pothole-sector17.jpg',
    restoredPhotoUrl: '/photos/pothole-restored1.jpg',
    severity: 'CRITICAL',
    roadCategory: 'COMMERCIAL_CORRIDOR',
    repairStatus: 'RESOLVED',
    eligibility: 'REPAIR_COMPLETED',
    authorityVerified: true,
    verifiedBy: 'Alice Sharma (Commissioner)',
    estimatedRepairCostINR: 29000,
    reportedDate: 'Oct 26, 2026',
    trafficVolume: 'HEAVY_COMMERCIAL',
    dimensions: '1.5m × 1.2m × 90mm deep',
    notes: 'Level-1 certified flush asphalt restoration completed under Larsen & Toubro CSR sponsorship.',
  },
];

export const INITIAL_SPONSORSHIP_REQUESTS: SponsorshipRequest[] = [
  {
    id: 'CSR-2026-881',
    companyName: 'Tata Motors CSR Infrastructure Wing',
    csrInitiativeName: 'Suraksha Marg: Indian Highway Resilience Pledge',
    contactPerson: 'Vikramaditya Sengupta',
    contactEmail: 'csr.roads@tatamotors.com',
    contactPhone: '+91 98140 22341',
    taxExemptionRequested: true,
    potholeIds: ['PF-102'],
    potholes: [INITIAL_COMPANY_POTHOLES[1]], // Madhya Marg
    totalEstimatedCostINR: 34000,
    proposedAmountINR: 34000,
    companyEmail: 'csr.roads@tatamotors.com',
    status: 'IN_PROGRESS',
    submittedAt: 'Oct 29, 2026 10:30 IST',
    authorityReviewDate: 'Oct 29, 2026 14:15 IST',
    authorityReviewerName: 'Alice Sharma (Municipal Commissioner)',
    assignedCrewName: 'Punjab PWD Unit 04',
    assignedCrewId: 'team-04',
    notes: 'Authority prioritized this major arterial. Saw-cutting and bitumen emulsion dispatched to site.',
    timeline: [
      {
        stage: 'PENDING_APPROVAL',
        label: 'CSR Proposal Submitted',
        timestamp: 'Oct 29, 10:30 IST',
        actorName: 'Tata Motors CSR Desk',
        description: 'Sponsorship pledge submitted for Madhya Marg high-risk defect.',
        completed: true,
      },
      {
        stage: 'APPROVED',
        label: 'Municipal Authority Sanction',
        timestamp: 'Oct 29, 14:15 IST',
        actorName: 'Alice Sharma (MC Commissioner)',
        description: 'Formal municipal clearance issued under CSR Urban Infrastructure Framework.',
        completed: true,
      },
      {
        stage: 'ASSIGNED',
        label: 'Work Order Dispatched',
        timestamp: 'Oct 30, 09:00 IST',
        actorName: 'MC Engineering Cell',
        description: 'Work order WO-PF-102 dispatched to field crew.',
        completed: true,
      },
      {
        stage: 'IN_PROGRESS',
        label: 'Site Compaction Underway',
        timestamp: 'Oct 30, 11:45 IST',
        actorName: 'Gurpreet Singh (Lead)',
        description: 'Saw-cut square excavation and asphalt compaction in progress.',
        completed: true,
        isCurrent: true,
      },
      {
        stage: 'COMPLETED',
        label: 'Level-1 Compaction Audit',
        description: 'Mandatory before/after photographic audit and commissioner sign-off.',
        completed: false,
      },
    ],
  },
  {
    id: 'CSR-2026-882',
    companyName: 'Infosys Foundation Urban Mobility Program',
    csrInitiativeName: 'Smart Corridors For Safe Commuting',
    contactPerson: 'Meera Nambiar',
    contactEmail: 'meera.csr@infosys.org',
    contactPhone: '+91 97790 44102',
    taxExemptionRequested: true,
    potholeIds: ['PF-103'],
    potholes: [INITIAL_COMPANY_POTHOLES[2]], // NH-5 Kharar
    totalEstimatedCostINR: 42000,
    proposedAmountINR: 42000,
    companyEmail: 'meera.csr@infosys.org',
    status: 'APPROVED',
    submittedAt: 'Oct 29, 2026 16:00 IST',
    authorityReviewDate: 'Oct 30, 2026 11:30 IST',
    authorityReviewerName: 'Punjab PWD Inspection Squad',
    assignedCrewName: 'Punjab PWD Unit 04',
    assignedCrewId: 'team-04',
    notes: 'Cleared for high-speed highway hot-mix restoration during off-peak night window.',
    timeline: [
      {
        stage: 'PENDING_APPROVAL',
        label: 'CSR Proposal Submitted',
        timestamp: 'Oct 29, 16:00 IST',
        actorName: 'Infosys Foundation',
        description: 'Sponsorship pledge submitted for NH-5 freight transit sector.',
        completed: true,
      },
      {
        stage: 'APPROVED',
        label: 'Municipal Authority Sanction',
        timestamp: 'Oct 30, 11:30 IST',
        actorName: 'Alice Sharma (MC Commissioner)',
        description: 'Joint clearance approved by Municipal Works & Punjab PWD highway division.',
        completed: true,
        isCurrent: true,
      },
      {
        stage: 'ASSIGNED',
        label: 'Work Order Dispatched',
        description: 'Awaiting crew schedule allocation.',
        completed: false,
      },
      {
        stage: 'IN_PROGRESS',
        label: 'Site Compaction Underway',
        description: 'Field restoration pending crew arrival.',
        completed: false,
      },
      {
        stage: 'COMPLETED',
        label: 'Level-1 Compaction Audit',
        description: 'Final audit sign-off.',
        completed: false,
      },
    ],
  },
  {
    id: 'CSR-2026-883',
    companyName: 'Larsen & Toubro CSR Infrastructure Wing',
    csrInitiativeName: 'PaveSafe India: Civic Quality Assurance',
    contactPerson: 'Deepak Chawla',
    contactEmail: 'csr@larsentoubro.com',
    contactPhone: '+91 98881 55670',
    taxExemptionRequested: true,
    potholeIds: ['PF-999'],
    potholes: [INITIAL_COMPANY_POTHOLES[9]], // Sector 17 Plaza West Wing
    totalEstimatedCostINR: 29000,
    proposedAmountINR: 29000,
    companyEmail: 'csr@larsentoubro.com',
    status: 'COMPLETED',
    submittedAt: 'Oct 25, 2026 09:15 IST',
    authorityReviewDate: 'Oct 25, 2026 12:00 IST',
    authorityReviewerName: 'Alice Sharma (Municipal Commissioner)',
    assignedCrewName: 'Punjab PWD Unit 04',
    assignedCrewId: 'team-04',
    completedAt: 'Oct 28, 2026 17:30 IST',
    notes: 'Level-1 certified completion. Saw-cut square perimeter and compaction flush with surrounding asphalt.',
    timeline: [
      {
        stage: 'PENDING_APPROVAL',
        label: 'CSR Proposal Submitted',
        timestamp: 'Oct 25, 09:15 IST',
        actorName: 'L&T CSR Desk',
        description: 'Commercial corridor restoration pledge.',
        completed: true,
      },
      {
        stage: 'APPROVED',
        label: 'Municipal Authority Sanction',
        timestamp: 'Oct 25, 12:00 IST',
        actorName: 'Alice Sharma (MC)',
        description: 'Cleared with priority Level-1 SLA.',
        completed: true,
      },
      {
        stage: 'ASSIGNED',
        label: 'Work Order Dispatched',
        timestamp: 'Oct 26, 08:30 IST',
        actorName: 'MC Engineering Cell',
        description: 'Work order WO-PF-999 assigned.',
        completed: true,
      },
      {
        stage: 'IN_PROGRESS',
        label: 'Site Compaction Underway',
        timestamp: 'Oct 27, 14:00 IST',
        actorName: 'Punjab PWD Unit 04',
        description: 'Hot-mix compaction completed.',
        completed: true,
      },
      {
        stage: 'COMPLETED',
        label: 'Level-1 Compaction Audit Certified',
        timestamp: 'Oct 28, 17:30 IST',
        actorName: 'Alice Sharma (Commissioner)',
        description: 'Post-repair photographic evidence audited. Level-1 municipal pass signed off.',
        completed: true,
        isCurrent: true,
      },
    ],
    completionEvidence: {
      beforePhotoUrl: '/photos/pothole-sector17.jpg',
      afterPhotoUrl: '/photos/pothole-restored1.jpg',
      inspectedBy: 'Alice Sharma (Municipal Commissioner)',
      compactionAuditPass: true,
      completionDate: 'Oct 28, 2026',
      certificateId: 'CERT-MC-CHD-2026-999',
      notes: 'Asphalt saw-cut square patch flush with pavement grade. Zero edge raveling observed.',
    },
  },
  {
    id: 'CSR-2026-884',
    companyName: 'Mahindra Rise Highway Safety Pledge',
    csrInitiativeName: 'Safer Corridors for Safer Families',
    contactPerson: 'Ananya Mukherjee',
    contactEmail: 'ananya.m@mahindra.com',
    contactPhone: '+91 98762 10098',
    taxExemptionRequested: true,
    potholeIds: ['PF-204'],
    potholes: [INITIAL_COMPANY_POTHOLES[3]], // Himalaya Marg
    totalEstimatedCostINR: 26000,
    proposedAmountINR: 26000,
    companyEmail: 'ananya.m@mahindra.com',
    status: 'PENDING_APPROVAL',
    submittedAt: 'Oct 30, 2026 18:20 IST',
    notes: 'Submitted for Municipal Authority triage review. Awaiting formal municipal approval.',
    timeline: [
      {
        stage: 'PENDING_APPROVAL',
        label: 'CSR Proposal Submitted',
        timestamp: 'Oct 30, 18:20 IST',
        actorName: 'Mahindra Rise CSR',
        description: 'Pledge submitted for Himalaya Marg high-traffic defect.',
        completed: true,
        isCurrent: true,
      },
      {
        stage: 'APPROVED',
        label: 'Municipal Authority Sanction',
        description: 'Under review at Municipal Triage Desk.',
        completed: false,
      },
      {
        stage: 'ASSIGNED',
        label: 'Work Order Dispatched',
        description: 'Pending authority sanction.',
        completed: false,
      },
      {
        stage: 'IN_PROGRESS',
        label: 'Site Compaction Underway',
        description: 'Pending dispatch.',
        completed: false,
      },
      {
        stage: 'COMPLETED',
        label: 'Level-1 Compaction Audit',
        description: 'Final audit sign-off.',
        completed: false,
      },
    ],
  },
  {
    id: 'CSR-2026-885',
    companyName: 'Tata Motors CSR Infrastructure Wing',
    csrInitiativeName: 'Suraksha Marg: Indian Highway Resilience Pledge',
    contactPerson: 'Vikramaditya Sengupta',
    contactEmail: 'csr.roads@tatamotors.com',
    contactPhone: '+91 98140 22341',
    taxExemptionRequested: false,
    potholeIds: ['PF-101', 'PF-102'],
    potholes: [INITIAL_COMPANY_POTHOLES[0], INITIAL_COMPANY_POTHOLES[1]], // Sector 17 Plaza & Madhya Marg
    totalEstimatedCostINR: 60500,
    proposedAmountINR: 60500,
    companyEmail: 'csr.roads@tatamotors.com',
    status: 'PENDING_APPROVAL',
    submittedAt: 'Oct 31, 2026 08:45 IST',
    notes: 'Arterial dual-corridor sponsorship proposal submitted for Municipal Authority review and squad dispatch.',
    timeline: [
      {
        stage: 'PENDING_APPROVAL',
        label: 'CSR Proposal Submitted',
        timestamp: 'Oct 31, 08:45 IST',
        actorName: 'Tata Motors CSR',
        description: 'Pledge submitted for Sector 17 & Madhya Marg commercial corridors.',
        completed: true,
        isCurrent: true,
      },
      {
        stage: 'APPROVED',
        label: 'Municipal Authority Sanction',
        description: 'Awaiting review and validation by Municipal Commissioner Alice Sharma.',
        completed: false,
      },
      {
        stage: 'ASSIGNED',
        label: 'Work Order Dispatched',
        description: 'Awaiting repair unit dispatch.',
        completed: false,
      },
      {
        stage: 'IN_PROGRESS',
        label: 'Site Compaction Underway',
        description: 'Awaiting asphalt compaction.',
        completed: false,
      },
      {
        stage: 'COMPLETED',
        label: 'Level-1 Compaction Audit',
        description: 'Final audit sign-off.',
        completed: false,
      },
    ],
  },
];

class CompanyService {
  private getStoredPotholes(): CompanyPothole[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_POTHOLES);
      if (data) return JSON.parse(data);
    } catch {}
    localStorage.setItem(STORAGE_KEY_POTHOLES, JSON.stringify(INITIAL_COMPANY_POTHOLES));
    return INITIAL_COMPANY_POTHOLES;
  }

  private savePotholes(potholes: CompanyPothole[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_POTHOLES, JSON.stringify(potholes));
    } catch {}
  }

  private getStoredRequests(): SponsorshipRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (data) {
        const parsed = JSON.parse(data) as SponsorshipRequest[];
        return parsed.map((r) => ({
          ...r,
          proposedAmountINR: r.proposedAmountINR ?? r.totalEstimatedCostINR,
          companyEmail: r.companyEmail ?? r.contactEmail,
        }));
      }
    } catch {}
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(INITIAL_SPONSORSHIP_REQUESTS));
    return INITIAL_SPONSORSHIP_REQUESTS;
  }

  private saveRequests(requests: SponsorshipRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
    } catch {}
  }

    public async syncWithBackend(companyEmailOrId?: string): Promise<SponsorshipRequest[]> {
    try {
      const url = companyEmailOrId
        ? `${API_BASE_URL}/sponsorships?company_email=${encodeURIComponent(companyEmailOrId)}`
        : `${API_BASE_URL}/sponsorships`;
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        const backendProposals = await res.json();
        if (Array.isArray(backendProposals) && backendProposals.length > 0) {
          const allPotholes = this.getStoredPotholes();
          const currentLocal = this.getStoredRequests();

          const hydrated: SponsorshipRequest[] = backendProposals.map((bp: any) => {
            const pIds: string[] = Array.isArray(bp.potholeIds) ? bp.potholeIds : [];
            const matchingPotholes = allPotholes.filter((p) => pIds.includes(p.id));
            return {
              id: bp.id,
              companyId: bp.companyId || `comp-${(bp.companyEmail || '').split('@')[0]}`,
              companyName: bp.companyName,
              companyEmail: bp.companyEmail,
              csrInitiativeName: bp.csrInitiativeName,
              contactPerson: bp.contactPerson,
              contactEmail: bp.contactEmail,
              contactPhone: bp.contactPhone,
              taxExemptionRequested: bp.taxExemptionRequested || false,
              potholeIds: pIds,
              potholes: matchingPotholes,
              totalEstimatedCostINR: bp.totalEstimatedCostINR,
              proposedAmountINR: bp.proposedAmountINR,
              status: bp.status,
              submittedAt: bp.submittedAt,
              authorityReviewDate: bp.authorityReviewDate,
              authorityReviewerName: bp.authorityReviewerName,
              rejectionReason: bp.rejectionReason,
              changesRequestedNotes: bp.changesRequestedNotes,
              assignedCrewName: bp.assignedCrewName,
              notes: bp.notes,
              authorityNotes: bp.authorityNotes,
              timeline: Array.isArray(bp.timeline) ? bp.timeline : [],
            };
          });

          const backendIds = new Set(hydrated.map((h) => h.id));
          const localOnly = currentLocal.filter((l) => !backendIds.has(l.id));
          const merged = [...hydrated, ...localOnly];
          this.saveRequests(merged);
          return this.getSponsorshipRequests(companyEmailOrId);
        }
      }
    } catch {}
    return this.getSponsorshipRequests(companyEmailOrId);
  }

  public getAvailablePotholes(): CompanyPothole[] {
    return this.getStoredPotholes();
  }

  public getSponsorshipRequests(companyEmailOrId?: string): SponsorshipRequest[] {
    const all = this.getStoredRequests();
    if (!companyEmailOrId) return all;
    const clean = companyEmailOrId.toLowerCase().trim();
    return all.filter((r) => {
      const email = (r.companyEmail || r.contactEmail || '').toLowerCase();
      const id = (r.companyId || '').toLowerCase();
      return email === clean || id === clean || email.includes(clean) || clean.includes(email);
    });
  }

  public getCompanyProfile(companyEmail?: string): CompanyProfile {
    try {
      if (companyEmail) {
        const cleanEmail = companyEmail.toLowerCase().trim();
        const storedKey = `${STORAGE_KEY_PROFILE}_${cleanEmail}`;
        const data = localStorage.getItem(storedKey);
        if (data) return JSON.parse(data);

        if (cleanEmail.includes('tatamotors')) {
          return DEFAULT_COMPANY_PROFILE;
        }
        if (cleanEmail.includes('infosys')) {
          return {
            id: 'comp-infosys-csr-01',
            companyName: 'Infosys Foundation Urban Mobility Program',
            initiativeName: 'Smart Corridors For Safe Commuting',
            representativeName: 'Meera Nambiar',
            email: 'meera.csr@infosys.org',
            phone: '+91 97790 44102',
            sector: 'Information Technology & Foundation',
            csrBudgetINR: 4000000,
            taxId: 'AAACI1234F',
          };
        }
        const defaultProfile: CompanyProfile = {
          id: `comp-${cleanEmail.split('@')[0]}`,
          companyName: cleanEmail.split('@')[1]?.split('.')[0]?.toUpperCase() + ' CSR Division',
          initiativeName: 'Highway Resilience & Commuter Protection Pledge',
          representativeName: cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: '+91 98000 00000',
          sector: 'Corporate Infrastructure Sponsorship',
          csrBudgetINR: 5000000,
          taxId: 'AAACX9999F',
        };
        localStorage.setItem(storedKey, JSON.stringify(defaultProfile));
        return defaultProfile;
      }
      const data = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (data) return JSON.parse(data);
    } catch {}
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(DEFAULT_COMPANY_PROFILE));
    return DEFAULT_COMPANY_PROFILE;
  }

  public updateCompanyProfile(profile: Partial<CompanyProfile>): CompanyProfile {
    const current = this.getCompanyProfile(profile.email);
    const updated = { ...current, ...profile };
    try {
      if (profile.email) {
        localStorage.setItem(`${STORAGE_KEY_PROFILE}_${profile.email.toLowerCase().trim()}`, JSON.stringify(updated));
      }
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
    } catch {}
    return updated;
  }

  public getDashboardMetrics(selectedPotholeIds: string[] = [], companyEmailOrId?: string): CompanyDashboardMetrics {
    const potholes = this.getAvailablePotholes();
    const requests = this.getSponsorshipRequests(companyEmailOrId);

    const eligiblePotholes = potholes.filter(
      (p) => p.eligibility === 'ELIGIBLE_VERIFIED' && p.repairStatus !== 'RESOLVED'
    );
    const highSeverity = eligiblePotholes.filter(
      (p) => p.severity === 'CRITICAL' || p.severity === 'HIGH'
    );

    const activeRequests = requests.filter(
      (r) => r.status === 'PENDING_APPROVAL' || r.status === 'APPROVED' || r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED'
    );
    const completedRequests = requests.filter((r) => r.status === 'COMPLETED');

    const totalCommitted = requests
      .filter((r) => r.status !== 'REJECTED')
      .reduce((sum, r) => sum + (r.proposedAmountINR || r.totalEstimatedCostINR), 0);

    return {
      totalEligibleCount: eligiblePotholes.length,
      highSeverityCount: highSeverity.length,
      selectedCount: selectedPotholeIds.length,
      activeSponsorshipsCount: activeRequests.length,
      completedRepairsCount: completedRequests.length,
      totalCsrCommittedINR: totalCommitted,
      commutersProtectedEstimate: 340000 + completedRequests.length * 45000,
    };
  }

  public submitSponsorshipRequest(input: {
    companyId?: string;
    companyName: string;
    companyEmail?: string;
    csrInitiativeName: string;
    contactPerson?: string;
    contactName?: string;
    contactEmail: string;
    contactPhone: string;
    taxExemptionRequested?: boolean;
    selectedPotholeIds?: string[];
    potholeIds?: string[];
    proposedAmountINR?: number;
    csrBudgetYear?: string;
    companyNotes?: string;
    notes?: string;
  }): { success: boolean; request: SponsorshipRequest } {
    const allPotholes = this.getStoredPotholes();
    const effectivePotholeIds = input.selectedPotholeIds || input.potholeIds || [];
    const selectedPotholes = allPotholes.filter((p) => effectivePotholeIds.includes(p.id));

    const totalCost = selectedPotholes.reduce((sum, p) => sum + p.estimatedRepairCostINR, 0);
    const proposedAmount = input.proposedAmountINR && input.proposedAmountINR > 0
      ? input.proposedAmountINR
      : totalCost;
    const newRequestId = `CSR-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newRequest: SponsorshipRequest = {
      id: newRequestId,
      companyId: input.companyId || `comp-${input.contactEmail.split('@')[0]}`,
      companyEmail: (input.companyEmail || input.contactEmail).toLowerCase().trim(),
      companyName: input.companyName,
      csrInitiativeName: input.csrInitiativeName,
      contactPerson: input.contactName || input.contactPerson || 'CSR Director',
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      taxExemptionRequested: !!input.taxExemptionRequested,
      potholeIds: effectivePotholeIds,
      potholes: selectedPotholes,
      totalEstimatedCostINR: totalCost,
      proposedAmountINR: proposedAmount,
      status: 'PENDING_APPROVAL',
      submittedAt: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      notes: input.notes || 'Formal CSR sponsorship pledge submitted for municipal review.',
      timeline: [
        {
          stage: 'PENDING_APPROVAL',
          label: 'CSR Proposal Submitted',
          timestamp: 'Just now',
          actorName: input.companyName,
          description: `Sponsorship proposal for ${selectedPotholes.length} road defect(s) pledged at ₹${proposedAmount.toLocaleString('en-IN')}.`,
          completed: true,
          isCurrent: true,
        },
        {
          stage: 'APPROVED',
          label: 'Municipal Authority Sanction',
          description: 'Awaiting formal municipal sanction and work order dispatch by Municipal Corporation Public Works Department.',
          completed: false,
        },
        {
          stage: 'ASSIGNED',
          label: 'Work Order Dispatched',
          description: 'Municipal engineering cell assigns defect to designated repair unit.',
          completed: false,
        },
        {
          stage: 'IN_PROGRESS',
          label: 'Site Compaction Underway',
          description: 'Field crew performs saw-cut excavation and hot-mix compaction.',
          completed: false,
        },
        {
          stage: 'COMPLETED',
          label: 'Level-1 Compaction Audit Certified',
          description: 'Mandatory before/after photographic comparison and municipal commissioner pass.',
          completed: false,
        },
      ],
    };

    // Update potholes to ALREADY_SPONSORED
    const updatedPotholes = allPotholes.map((p) => {
      if (effectivePotholeIds.includes(p.id)) {
        return {
          ...p,
          eligibility: 'ALREADY_SPONSORED' as const,
        };
      }
      return p;
    });

    this.savePotholes(updatedPotholes);

    // Prepend to requests
    const currentRequests = this.getStoredRequests();
    const updatedRequests = [newRequest, ...currentRequests.filter((r) => r.id !== newRequest.id)];
    this.saveRequests(updatedRequests);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('potholefix_sponsorships_updated'));
    }

    // Persist to backend asynchronously
    fetch(`${API_BASE_URL}/sponsorships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: newRequest.companyId,
        companyName: newRequest.companyName,
        companyEmail: newRequest.companyEmail,
        csrInitiativeName: newRequest.csrInitiativeName,
        contactPerson: newRequest.contactPerson,
        contactEmail: newRequest.contactEmail,
        contactPhone: newRequest.contactPhone,
        taxExemptionRequested: newRequest.taxExemptionRequested,
        potholeIds: newRequest.potholeIds,
        totalEstimatedCostINR: newRequest.totalEstimatedCostINR,
        proposedAmountINR: newRequest.proposedAmountINR,
        notes: newRequest.notes,
      }),
    }).catch(() => {});

    return {
      success: true,
      request: newRequest,
    };
  }

  public reviseAndResubmitRequest(
    requestId: string,
    input: {
      companyName?: string;
      csrInitiativeName?: string;
      contactPerson?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      csrBudgetYear?: string;
      companyNotes?: string;
      selectedPotholeIds?: string[];
      potholeIds?: string[];
      proposedAmountINR?: number;
      notes?: string;
    }
  ): { success: boolean; request?: SponsorshipRequest; error?: string } {
    const requests = this.getStoredRequests();
    const reqIndex = requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      return { success: false, error: 'Sponsorship request not found.' };
    }

    const targetReq = requests[reqIndex];
    const allPotholes = this.getStoredPotholes();
    const potholeIds = input.selectedPotholeIds || input.potholeIds || targetReq.potholeIds;
    const selectedPotholes = allPotholes.filter((p) => potholeIds.includes(p.id));
    const totalCost = selectedPotholes.reduce((sum, p) => sum + p.estimatedRepairCostINR, 0);
    const proposedAmount = input.proposedAmountINR && input.proposedAmountINR > 0
      ? input.proposedAmountINR
      : (targetReq.proposedAmountINR || totalCost);

    const nowStr = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const updatedTimeline = [
      ...targetReq.timeline.map((step) => ({ ...step, isCurrent: false })),
      {
        stage: 'PENDING_APPROVAL' as const,
        label: 'CSR Proposal Resubmitted with Revisions',
        timestamp: nowStr,
        actorName: input.companyName || targetReq.companyName,
        description: `Revised proposal resubmitted following municipal authority review. Proposed Amount: ₹${proposedAmount.toLocaleString('en-IN')}. Notes: ${input.notes || 'Updated proposal specifications.'}`,
        completed: true,
        isCurrent: true,
      },
    ];

    const updatedReq: SponsorshipRequest = {
      ...targetReq,
      companyName: input.companyName || targetReq.companyName,
      csrInitiativeName: input.csrInitiativeName || targetReq.csrInitiativeName,
      contactPerson: input.contactName || input.contactPerson || targetReq.contactPerson,
      contactEmail: input.contactEmail || targetReq.contactEmail,
      contactPhone: input.contactPhone || targetReq.contactPhone,
      potholeIds,
      potholes: selectedPotholes,
      totalEstimatedCostINR: totalCost,
      proposedAmountINR: proposedAmount,
      status: 'PENDING_APPROVAL',
      submittedAt: nowStr,
      notes: input.notes || input.companyNotes || targetReq.notes,
      timeline: updatedTimeline,
    };

    requests[reqIndex] = updatedReq;
    this.saveRequests(requests);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('potholefix_sponsorships_updated'));
    }

    fetch(`${API_BASE_URL}/sponsorships/${requestId}/resubmit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposedAmountINR: proposedAmount,
        contactName: updatedReq.contactPerson,
        contactEmail: updatedReq.contactEmail,
        contactPhone: updatedReq.contactPhone,
        notes: updatedReq.notes,
      }),
    }).catch(() => {});

    return { success: true, request: updatedReq };
  }
  /**
   * Validate a sponsorship proposal before Municipal Authority approval.
   */
  public validateRequestForApproval(
    request: SponsorshipRequest,
    reviewerJurisdiction: string = 'Chandigarh'
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request.potholes || request.potholes.length === 0) {
      errors.push('Proposal contains no registered road defect records.');
      return { isValid: false, errors, warnings };
    }

    const currentPotholes = this.getStoredPotholes();

    for (const pothole of request.potholes) {
      const livePothole = currentPotholes.find((p) => p.id === pothole.id);

      if (!livePothole) {
        errors.push(`Defect #${pothole.id} (${pothole.roadName}) no longer exists in municipal database.`);
        continue;
      }

      if (!livePothole.authorityVerified) {
        errors.push(`Defect #${pothole.id} has not undergone municipal field triage verification.`);
      }

      if (livePothole.repairStatus === 'RESOLVED') {
        errors.push(`Defect #${pothole.id} (${pothole.roadName}) is already marked REPAIRED.`);
      }

      // Check jurisdiction (e.g. Chandigarh vs Punjab)
      if (
        reviewerJurisdiction.toLowerCase().includes('chandigarh') &&
        !livePothole.city.toLowerCase().includes('chandigarh') &&
        !livePothole.state.toLowerCase().includes('chandigarh')
      ) {
        warnings.push(`Defect #${pothole.id} is in ${livePothole.city}, ${livePothole.state} (Requires inter-municipal or NHAI concurrence).`);
      }

      // Cost reasonableness check
      if (livePothole.estimatedRepairCostINR <= 0 || livePothole.estimatedRepairCostINR > 500000) {
        errors.push(`Estimated cost ₹${livePothole.estimatedRepairCostINR} for #${pothole.id} falls outside allowable municipal thresholds.`);
      }
    }

    // Check for conflicting active sponsorships
    const allRequests = this.getStoredRequests();
    const otherActiveRequests = allRequests.filter(
      (r) => r.id !== request.id && ['APPROVED', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status)
    );
    for (const pothole of request.potholes) {
      const conflict = otherActiveRequests.find((r) => r.potholeIds.includes(pothole.id));
      if (conflict) {
        warnings.push(`Defect #${pothole.id} was previously referenced in sponsorship ${conflict.id} (${conflict.companyName}).`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public approveSponsorshipRequest(
    requestId: string,
    reviewerName: string = 'Alice Sharma (Commissioner)',
    notes?: string
  ): { success: boolean; request?: SponsorshipRequest; error?: string } {
    const requests = this.getStoredRequests();
    const reqIndex = requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      return { success: false, error: 'Sponsorship request not found.' };
    }

    const targetReq = requests[reqIndex];
    const validation = this.validateRequestForApproval(targetReq);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(' ') };
    }

    const nowStr = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const updatedTimeline = targetReq.timeline.map((step) => {
      if (step.stage === 'APPROVED') {
        return {
          ...step,
          completed: true,
          isCurrent: true,
          timestamp: nowStr,
          actorName: reviewerName,
          description: notes || 'Municipal sanction granted by Commissioner. Work order queued for dispatch.',
        };
      }
      if (step.stage === 'PENDING_APPROVAL') {
        return { ...step, isCurrent: false };
      }
      return step;
    });

    const updatedReq: SponsorshipRequest = {
      ...targetReq,
      status: 'APPROVED',
      authorityReviewDate: nowStr,
      authorityReviewerName: reviewerName,
      authorityNotes: notes || 'Proposal approved for squad dispatch.',
      isFundsReceived: false, // Explicit: approval does NOT mean funds received
      timeline: updatedTimeline,
    };

    requests[reqIndex] = updatedReq;
    this.saveRequests(requests);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('potholefix_sponsorships_updated'));
    }

    fetch(`${API_BASE_URL}/sponsorships/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'APPROVED',
        authorityReviewerName: reviewerName,
        authorityNotes: notes || 'Proposal approved for squad dispatch.',
      }),
    }).catch(() => {});

    return { success: true, request: updatedReq };
  }

  public rejectSponsorshipRequest(
    requestId: string,
    reason: string,
    reviewerName: string = 'Alice Sharma (Commissioner)'
  ): { success: boolean; request?: SponsorshipRequest; error?: string } {
    const requests = this.getStoredRequests();
    const reqIndex = requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      return { success: false, error: 'Sponsorship request not found.' };
    }

    const targetReq = requests[reqIndex];
    const nowStr = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const updatedTimeline = [
      ...targetReq.timeline.map((step) => ({ ...step, isCurrent: false })),
      {
        stage: 'REJECTED' as const,
        label: 'Sponsorship Proposal Rejected',
        timestamp: nowStr,
        actorName: reviewerName,
        description: `Rejected by Municipal Authority. Reason: ${reason}`,
        completed: true,
        isCurrent: true,
      },
    ];

    const updatedReq: SponsorshipRequest = {
      ...targetReq,
      status: 'REJECTED',
      authorityReviewDate: nowStr,
      authorityReviewerName: reviewerName,
      rejectionReason: reason,
      timeline: updatedTimeline,
    };

    requests[reqIndex] = updatedReq;
    this.saveRequests(requests);

    // Free up potholes so they return to eligible pool
    const allPotholes = this.getStoredPotholes();
    const updatedPotholes = allPotholes.map((p) => {
      if (targetReq.potholeIds.includes(p.id) && p.eligibility === 'ALREADY_SPONSORED') {
        return { ...p, eligibility: 'ELIGIBLE_VERIFIED' as const };
      }
      return p;
    });
    this.savePotholes(updatedPotholes);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('potholefix_sponsorships_updated'));
    }

    fetch(`${API_BASE_URL}/sponsorships/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'REJECTED',
        rejectionReason: reason,
        authorityReviewerName: reviewerName,
      }),
    }).catch(() => {});

    return { success: true, request: updatedReq };
  }

  public requestChangesForSponsorship(
    requestId: string,
    changesNote: string,
    reviewerName: string = 'Alice Sharma (Commissioner)'
  ): { success: boolean; request?: SponsorshipRequest; error?: string } {
    const requests = this.getStoredRequests();
    const reqIndex = requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      return { success: false, error: 'Sponsorship request not found.' };
    }

    const targetReq = requests[reqIndex];
    const nowStr = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const updatedTimeline = [
      ...targetReq.timeline.map((step) => ({ ...step, isCurrent: false })),
      {
        stage: 'CHANGES_REQUESTED' as const,
        label: 'Revisions Requested by Authority',
        timestamp: nowStr,
        actorName: reviewerName,
        description: `Changes requested by ${reviewerName}: ${changesNote}`,
        completed: true,
        isCurrent: true,
      },
    ];

    const updatedReq: SponsorshipRequest = {
      ...targetReq,
      status: 'CHANGES_REQUESTED',
      authorityReviewDate: nowStr,
      authorityReviewerName: reviewerName,
      changesRequestedNotes: changesNote,
      timeline: updatedTimeline,
    };

    requests[reqIndex] = updatedReq;
    this.saveRequests(requests);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('potholefix_sponsorships_updated'));
    }

    fetch(`${API_BASE_URL}/sponsorships/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CHANGES_REQUESTED',
        authorityReviewerName: reviewerName,
        changesRequestedNotes: changesNote,
      }),
    }).catch(() => {});

    return { success: true, request: updatedReq };
  }

  public partiallyApproveSponsorship(
    requestId: string,
    approvedPotholeIds: string[],
    reviewerName: string = 'Alice Sharma (Commissioner)',
    notes?: string
  ): { success: boolean; request?: SponsorshipRequest; error?: string } {
    const requests = this.getStoredRequests();
    const reqIndex = requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      return { success: false, error: 'Sponsorship request not found.' };
    }

    const targetReq = requests[reqIndex];
    const approvedPotholes = targetReq.potholes.filter((p) => approvedPotholeIds.includes(p.id));
    const excludedPotholeIds = targetReq.potholeIds.filter((id) => !approvedPotholeIds.includes(id));

    const totalCost = approvedPotholes.reduce((sum, p) => sum + p.estimatedRepairCostINR, 0);
    const nowStr = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const updatedTimeline = targetReq.timeline.map((step) => {
      if (step.stage === 'APPROVED') {
        return {
          ...step,
          completed: true,
          isCurrent: true,
          timestamp: nowStr,
          actorName: reviewerName,
          description: `Partially approved: ${approvedPotholes.length} of ${targetReq.potholeIds.length} defects sanctioned. ${notes || ''}`,
        };
      }
      return step;
    });

    const updatedReq: SponsorshipRequest = {
      ...targetReq,
      status: 'APPROVED',
      potholeIds: approvedPotholeIds,
      potholes: approvedPotholes,
      totalEstimatedCostINR: totalCost,
      partiallyApprovedPotholeIds: approvedPotholeIds,
      authorityReviewDate: nowStr,
      authorityReviewerName: reviewerName,
      authorityNotes: notes || `Partially sanctioned (${approvedPotholes.length} defects).`,
      isFundsReceived: false,
      timeline: updatedTimeline,
    };

    requests[reqIndex] = updatedReq;
    this.saveRequests(requests);

    // Free up excluded potholes
    const allPotholes = this.getStoredPotholes();
    const updatedPotholes = allPotholes.map((p) => {
      if (excludedPotholeIds.includes(p.id) && p.eligibility === 'ALREADY_SPONSORED') {
        return { ...p, eligibility: 'ELIGIBLE_VERIFIED' as const };
      }
      return p;
    });
    this.savePotholes(updatedPotholes);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('potholefix_sponsorships_updated'));
    }

    fetch(`${API_BASE_URL}/sponsorships/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'APPROVED',
        authorityReviewerName: reviewerName,
        authorityNotes: notes || `Partially sanctioned (${approvedPotholes.length} defects).`,
      }),
    }).catch(() => {});

    return { success: true, request: updatedReq };
  }

  public getPendingRequestsCount(): number {
    return this.getStoredRequests().filter((r) => r.status === 'PENDING_APPROVAL').length;
  }

  public getAuthoritySponsorshipMetrics() {
    const all = this.getStoredRequests();
    return {
      totalRequests: all.length,
      pendingCount: all.filter((r) => r.status === 'PENDING_APPROVAL').length,
      approvedCount: all.filter((r) => r.status === 'APPROVED').length,
      changesRequestedCount: all.filter((r) => r.status === 'CHANGES_REQUESTED').length,
      rejectedCount: all.filter((r) => r.status === 'REJECTED').length,
      activeRepairsCount: all.filter((r) => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length,
      completedRepairsCount: all.filter((r) => r.status === 'COMPLETED').length,
      totalPledgedAmountINR: all.reduce((sum, r) => sum + r.totalEstimatedCostINR, 0),
    };
  }

  public resetToDefaultData(): void {
    localStorage.removeItem(STORAGE_KEY_POTHOLES);
    localStorage.removeItem(STORAGE_KEY_REQUESTS);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
  }
}

export const companyService = new CompanyService();
