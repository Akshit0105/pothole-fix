import type {
  PotholeReport,
  CreateReportInput,
  ReportStatus,
  SeverityLevel,
} from '../types';
import { apiClient, isMockMode } from './apiClient';

const STORAGE_KEY = 'potholefix_mock_reports_v4';

// Exactly THREE seeded Indian demo reports (all initially SUBMITTED for complete testability)
const INITIAL_SEED_REPORTS: PotholeReport[] = [
  {
    id: 'PF-101',
    trackingNumber: 'PF-101',
    reporterId: 'user-citizen-01',
    reporterName: 'Akshit Sharma',
    reporterEmail: 'akshit@potholefix.in',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    location: {
      latitude: 30.7398,
      longitude: 76.7827,
      address: 'Sector 17 Plaza Corridor, Chandigarh',
    },
    description: 'Deep structural asphalt crater with fractured jagged borders on Sector 17 commercial transit corridor, causing severe vehicle swerving.',
    damageImageUrl: '/photos/pothole-sector17.jpg',
    aiDetection: {
      isModelConnected: false,
      detected: true,
      confidence: 0.94,
      severityScore: 'CRITICAL',
      boundingBoxes: [],
      detectedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    status: 'SUBMITTED',
    statusHistory: [
      {
        status: 'SUBMITTED',
        timestamp: 'Today 10:00 IST',
        note: 'Citizen logged hazard photo with GPS coordinates via PotholeFix.',
        actorName: 'Akshit Sharma',
      },
    ],
  },
  {
    id: 'PF-102',
    trackingNumber: 'PF-102',
    reporterId: 'user-citizen-02',
    reporterName: 'Harjot Singh',
    reporterEmail: 'harjot@potholefix.in',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    location: {
      latitude: 30.7290,
      longitude: 76.8040,
      address: 'Madhya Marg Arterial, Sector 26, Chandigarh',
    },
    description: 'Significant asphalt fatigue cracking and depression across main carriageway near grain market intersection.',
    damageImageUrl: '/photos/pothole-madhyamarg.jpg',
    aiDetection: {
      isModelConnected: false,
      detected: true,
      confidence: 0.91,
      severityScore: 'HIGH',
      boundingBoxes: [],
      detectedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    },
    status: 'SUBMITTED',
    statusHistory: [
      {
        status: 'SUBMITTED',
        timestamp: 'Today 08:30 IST',
        note: 'Citizen flagged high-risk road degradation on Madhya Marg transit corridor.',
        actorName: 'Harjot Singh',
      },
    ],
  },
  {
    id: 'PF-103',
    trackingNumber: 'PF-103',
    reporterId: 'user-citizen-03',
    reporterName: 'Sneha Patel',
    reporterEmail: 'sneha@potholefix.in',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    location: {
      latitude: 30.7499,
      longitude: 76.6433,
      address: 'National Highway 5, Kharar, Punjab',
    },
    description: 'Moderate asphalt road depression causing significant deceleration and commuter bicycle hazard near Kharar flyover junction.',
    damageImageUrl: '/photos/pothole-kharar.jpg',
    aiDetection: {
      isModelConnected: false,
      detected: true,
      confidence: 0.85,
      severityScore: 'MODERATE',
      boundingBoxes: [],
      detectedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    },
    status: 'SUBMITTED',
    statusHistory: [
      {
        status: 'SUBMITTED',
        timestamp: 'Today 07:15 IST',
        note: 'Citizen logged road defect near Kharar highway flyover junction.',
        actorName: 'Sneha Patel',
      },
    ],
  },
];

// --- Mock In-Memory / LocalStorage Repository ---
function getStoredReports(): PotholeReport[] {
  try {
    if (typeof localStorage === 'undefined') return INITIAL_SEED_REPORTS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_REPORTS));
      return INITIAL_SEED_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SEED_REPORTS;
  }
}

function saveStoredReports(reports: PotholeReport[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.warn('Browser storage quota reached. Falling back to memory.', e);
  }
}

const MockReportsRepository = {
  async getAllReports(): Promise<PotholeReport[]> {
    return getStoredReports();
  },

  async getPublicReports(): Promise<PotholeReport[]> {
    return getStoredReports();
  },

  async getReports(filter?: { status?: string; severity?: string; search?: string }): Promise<PotholeReport[]> {
    let reports = getStoredReports();
    if (!filter) return reports;

    if (filter.status && filter.status !== 'ALL') {
      reports = reports.filter((r) => r.status === filter.status);
    }
    if (filter.severity && filter.severity !== 'ALL') {
      reports = reports.filter((r) => r.aiDetection?.severityScore === filter.severity);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      reports = reports.filter(
        (r) =>
          r.trackingNumber.toLowerCase().includes(q) ||
          r.location.address.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    return reports;
  },

  async getMyReports(reporterId?: string): Promise<PotholeReport[]> {
    const reports = getStoredReports();
    if (!reporterId) return reports;
    return reports.filter((r) => r.reporterId === reporterId);
  },

  async getReportById(id: string): Promise<PotholeReport | undefined> {
    const reports = getStoredReports();
    return reports.find((r) => r.id === id || r.trackingNumber === id);
  },

  async createReport(input: CreateReportInput): Promise<PotholeReport> {
    const reports = getStoredReports();
    const nextNumber = Math.floor(115 + Math.random() * 20);
    const trackingNumber = `PF-${nextNumber}`;

    const newReport: PotholeReport = {
      id: trackingNumber,
      trackingNumber,
      reporterId: input.reporterId || 'user-citizen-01',
      reporterName: input.reporterName || 'Akshit Sharma',
      reporterEmail: input.reporterEmail || 'akshit@potholefix.in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: input.location,
      description: input.description,
      damageImageUrl:
        input.damageImageUrl ||
        '/photos/pothole-sector17.jpg',
      aiDetection: input.aiDetection,
      status: 'SUBMITTED',
      statusHistory: [
        {
          status: 'SUBMITTED',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: 'Report submitted by citizen with photographic evidence.',
          actorName: input.reporterName || 'Akshit Sharma',
        },
      ],
    };

    const updated = [newReport, ...reports];
    saveStoredReports(updated);
    return newReport;
  },

  async verifyReport(
    id: string,
    verified: boolean,
    reason?: string,
    actorName = 'Alice Sharma'
  ): Promise<PotholeReport> {
    const reports = getStoredReports();
    const index = reports.findIndex((r) => r.id === id || r.trackingNumber === id);
    if (index === -1) throw new Error(`Report #${id} not found`);

    const current = reports[index];
    const newStatus: ReportStatus = verified ? 'VERIFIED' : 'REJECTED';
    const note = verified
      ? 'Photographic defect confirmed by Authority Inspector.'
      : `Report rejected: ${reason || 'Does not meet municipal road defect criteria'}`;

    const updatedReport: PotholeReport = {
      ...current,
      status: newStatus,
      reworkNotes: verified ? undefined : reason,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...current.statusHistory,
        {
          status: newStatus,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note,
          actorName,
        },
      ],
    };

    reports[index] = updatedReport;
    saveStoredReports(reports);
    return updatedReport;
  },

  async updateReportStatus(
    id: string,
    status: ReportStatus,
    note?: string,
    actorName = 'Municipal Officer'
  ): Promise<PotholeReport> {
    const reports = getStoredReports();
    const index = reports.findIndex((r) => r.id === id || r.trackingNumber === id);
    if (index === -1) throw new Error(`Report #${id} not found`);

    const current = reports[index];
    const updatedReport: PotholeReport = {
      ...current,
      status,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...current.statusHistory,
        {
          status,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note,
          actorName,
        },
      ],
    };

    reports[index] = updatedReport;
    saveStoredReports(reports);
    return updatedReport;
  },

  async updateReportSeverity(
    id: string,
    severity: SeverityLevel,
    note?: string,
    actorName = 'Municipal Officer'
  ): Promise<PotholeReport> {
    const reports = getStoredReports();
    const index = reports.findIndex((r) => r.id === id || r.trackingNumber === id);
    if (index === -1) throw new Error(`Report #${id} not found`);

    const current = reports[index];
    const prevSeverity = current.aiDetection?.severityScore || 'UNASSESSED';
    const auditNote = note || `Authority adjusted severity from ${prevSeverity} to ${severity}.`;

    const updatedReport: PotholeReport = {
      ...current,
      aiDetection: {
        ...(current.aiDetection || {
          isModelConnected: false,
          detected: true,
          confidence: 1.0,
          boundingBoxes: [],
        }),
        severityScore: severity,
      },
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...current.statusHistory,
        {
          status: current.status,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: auditNote,
          actorName,
        },
      ],
    };

    reports[index] = updatedReport;
    saveStoredReports(reports);
    return updatedReport;
  },

  async submitRepairCompletion(
    id: string,
    restoredImageUrl: string,
    notes?: string,
    actorName = 'Gurpreet Singh'
  ): Promise<PotholeReport> {
    const reports = getStoredReports();
    const index = reports.findIndex((r) => r.id === id || r.trackingNumber === id);
    if (index === -1) throw new Error(`Report #${id} not found`);

    const current = reports[index];
    const updatedReport: PotholeReport = {
      ...current,
      status: 'AWAITING_APPROVAL',
      restoredImageUrl,
      reworkNotes: notes,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...current.statusHistory,
        {
          status: 'AWAITING_APPROVAL',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: `Field repair completed: ${notes || 'Post-repair evidence submitted'}.`,
          actorName,
        },
      ],
    };

    reports[index] = updatedReport;
    saveStoredReports(reports);
    return updatedReport;
  },
};

// --- Real HTTP Repository (Connects to FastAPI) ---
const HttpReportsRepository = {
  async getAllReports(): Promise<PotholeReport[]> {
    return apiClient.get<PotholeReport[]>('/reports');
  },

  async getPublicReports(): Promise<PotholeReport[]> {
    try {
      return await apiClient.get<PotholeReport[]>('/reports/public');
    } catch (err) {
      console.warn('Could not fetch /reports/public, falling back to mock storage', err);
      return getStoredReports();
    }
  },

  async getReports(filter?: { status?: string; severity?: string; search?: string }): Promise<PotholeReport[]> {
    const params = new URLSearchParams();
    if (filter?.status && filter.status !== 'ALL') params.set('status', filter.status);
    if (filter?.severity && filter.severity !== 'ALL') params.set('severity', filter.severity);
    if (filter?.search) params.set('search', filter.search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<PotholeReport[]>(`/reports${qs}`);
  },

  async getMyReports(_reporterId?: string): Promise<PotholeReport[]> {
    return apiClient.get<PotholeReport[]>('/reports/my');
  },

  async getReportById(id: string): Promise<PotholeReport | undefined> {
    return apiClient.get<PotholeReport>(`/reports/${id}`);
  },

  async createReport(input: CreateReportInput): Promise<PotholeReport> {
    // If an imageFile is supplied, use multipart/form-data
    if (input.imageFile) {
      const formData = new FormData();
      formData.append('file', input.imageFile);
      formData.append('latitude', String(input.location.latitude));
      formData.append('longitude', String(input.location.longitude));
      formData.append('address', input.location.address);
      formData.append('description', input.description);

      if (input.aiDetection) {
        formData.append('ai_detection', JSON.stringify(input.aiDetection));
      }

      return apiClient.upload<PotholeReport>('/reports', formData);
    }

    // Otherwise send structured JSON
    return apiClient.post<PotholeReport>('/reports', {
      location: {
        latitude: Number(input.location.latitude),
        longitude: Number(input.location.longitude),
        address: input.location.address,
      },
      description: input.description,
      damage_image_url: input.damageImageUrl,
      ai_detection: input.aiDetection,
    });
  },

  async verifyReport(
    id: string,
    verified: boolean,
    reason?: string
  ): Promise<PotholeReport> {
    return apiClient.patch<PotholeReport>(`/reports/${id}/verify`, {
      verified,
      reason,
    });
  },

  async updateReportStatus(
    id: string,
    status: ReportStatus,
    note?: string
  ): Promise<PotholeReport> {
    return apiClient.patch<PotholeReport>(`/reports/${id}/status`, {
      status,
      note,
    });
  },

  async updateReportSeverity(
    id: string,
    severity: SeverityLevel,
    note?: string
  ): Promise<PotholeReport> {
    try {
      return await apiClient.patch<PotholeReport>(`/reports/${id}/status`, {
        severity,
        note,
      });
    } catch {
      return MockReportsRepository.updateReportSeverity(id, severity, note);
    }
  },

  async submitRepairCompletion(
    id: string,
    restoredImageUrl: string,
    notes?: string
  ): Promise<PotholeReport> {
    return apiClient.patch<PotholeReport>(`/reports/${id}/repair`, {
      restored_image_url: restoredImageUrl,
      notes,
    });
  },
};

// --- Delegating Facade (Auto-switches Mock vs Real API) ---
export const reportsService = {
  async getAllReports(): Promise<PotholeReport[]> {
    return isMockMode()
      ? MockReportsRepository.getAllReports()
      : HttpReportsRepository.getAllReports();
  },

  async getPublicReports(): Promise<PotholeReport[]> {
    return isMockMode()
      ? MockReportsRepository.getPublicReports()
      : HttpReportsRepository.getPublicReports();
  },

  async getReports(filter?: { status?: string; severity?: string; search?: string }): Promise<PotholeReport[]> {
    return isMockMode()
      ? MockReportsRepository.getReports(filter)
      : HttpReportsRepository.getReports(filter);
  },

  async getMyReports(reporterId?: string): Promise<PotholeReport[]> {
    return isMockMode()
      ? MockReportsRepository.getMyReports(reporterId)
      : HttpReportsRepository.getMyReports(reporterId);
  },

  async getReportById(id: string): Promise<PotholeReport | undefined> {
    return isMockMode()
      ? MockReportsRepository.getReportById(id)
      : HttpReportsRepository.getReportById(id);
  },

  async createReport(input: CreateReportInput): Promise<PotholeReport> {
    return isMockMode()
      ? MockReportsRepository.createReport(input)
      : HttpReportsRepository.createReport(input);
  },

  async verifyReport(
    id: string,
    verified: boolean,
    reason?: string,
    actorName = 'Alice Sharma'
  ): Promise<PotholeReport> {
    return isMockMode()
      ? MockReportsRepository.verifyReport(id, verified, reason, actorName)
      : HttpReportsRepository.verifyReport(id, verified, reason);
  },

  async updateReportStatus(
    id: string,
    status: ReportStatus,
    note?: string,
    actorName = 'Alice Sharma'
  ): Promise<PotholeReport> {
    return isMockMode()
      ? MockReportsRepository.updateReportStatus(id, status, note, actorName)
      : HttpReportsRepository.updateReportStatus(id, status, note);
  },

  async updateReportSeverity(
    id: string,
    severity: SeverityLevel,
    note?: string,
    actorName = 'Alice Sharma'
  ): Promise<PotholeReport> {
    return isMockMode()
      ? MockReportsRepository.updateReportSeverity(id, severity, note, actorName)
      : HttpReportsRepository.updateReportSeverity(id, severity, note);
  },

  async submitRepairCompletion(
    id: string,
    restoredImageUrl: string,
    notes?: string,
    actorName?: string
  ): Promise<PotholeReport> {
    return isMockMode()
      ? MockReportsRepository.submitRepairCompletion(id, restoredImageUrl, notes, actorName)
      : HttpReportsRepository.submitRepairCompletion(id, restoredImageUrl, notes);
  },

  async resetDemoReports(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_REPORTS));
    }
    try {
      await apiClient.post('/reports/reset-demo', {});
    } catch {
      // Offline fallback
    }
  },
};
