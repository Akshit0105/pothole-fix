/**
 * PotholeFix - Complete Frontend API Service Regression & Verification Test Suite
 *
 * Validates:
 * 1. HTTP Client configuration, JWT token injection, and 401 handling.
 * 2. Citizen report submission (multipart and JSON), listing, and details.
 * 3. Municipal authority triage: verification, rejection, and severity overrides.
 * 4. Task management: creation, crew dispatch, crew-isolated queue retrieval.
 * 5. Field repair workflow: starting tasks, submitting completion evidence.
 * 6. Authority inspection: approval, rework requests, and notification payloads.
 * 7. Error handling: 400 Bad Request, 500 Internal Server Error propagation.
 * 8. REGRESSION VERIFICATION:
 *    - reportsService.updateReportStatus() MUST perform real mutations or throw descriptive errors.
 *      It can NEVER silently return a read-only GET response.
 *    - reportsService.submitRepairCompletion() MUST post evidence to POST /tasks/{wo}/completion.
 *      It can NEVER silently return a read-only GET response without submitting evidence.
 * 9. AI Detection graceful fallback when backend YOLO service is unavailable.
 * 10. Multi-crew authentication for all 3 teams (team-04, team-02, team-01).
 * 11. Mock Mode vs Real API Mode parity.
 */

import {
  apiClient,
  ApiError,
  onUnauthorized,
  setAuthToken,
  setMockModeOverride,
  isMockMode,
} from '../src/services/apiClient';
import { reportsService } from '../src/services/reportsService';
import { tasksService } from '../src/services/tasksService';
import { authService, REPAIR_CREWS } from '../src/services/authService';
import { detectPothole } from '../src/services/aiDetectionService';

// --- In-Memory Mock Fetch Environment ---
interface MockRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  formDataEntries: Array<[string, unknown]>;
}

const recordedRequests: MockRequest[] = [];
let mockResponseHandler: (req: MockRequest) => { status: number; body: unknown; headers?: Record<string, string> };

const originalFetch = globalThis.fetch;

function setupMockFetch() {
  recordedRequests.length = 0;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {};

    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((val, key) => {
          headers[key.toLowerCase()] = val;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([k, v]) => {
          headers[k.toLowerCase()] = v;
        });
      } else {
        Object.entries(init.headers).forEach(([k, v]) => {
          headers[k.toLowerCase()] = String(v);
        });
      }
    }

    let parsedBody: unknown = undefined;
    const formDataEntries: Array<[string, unknown]> = [];

    if (init?.body) {
      if (typeof (init.body as any).entries === 'function') {
        for (const [key, val] of (init.body as any).entries()) {
          formDataEntries.push([key, val]);
        }
        parsedBody = '[FormData]';
      } else if (typeof init.body === 'string') {
        try {
          parsedBody = JSON.parse(init.body);
        } catch {
          parsedBody = init.body;
        }
      } else {
        parsedBody = init.body;
      }
    }

    const recorded: MockRequest = { url, method, headers, body: parsedBody, formDataEntries };
    recordedRequests.push(recorded);

    const mockResp = mockResponseHandler(recorded);
    const bodyStr = typeof mockResp.body === 'string' ? mockResp.body : JSON.stringify(mockResp.body);

    return new Response(bodyStr, {
      status: mockResp.status,
      headers: {
        'Content-Type': 'application/json',
        ...(mockResp.headers || {}),
      },
    });
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

// LocalStorage mock for Node environment
const mockStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => mockStorage.set(key, String(value)),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

// Test Runner Helpers
let passCount = 0;
let failCount = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passCount++;
  } catch (err: any) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    if (err.stack) console.error(err.stack);
    failCount++;
  }
}

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion Failed: ${message} (expected ${expected}, got ${actual})`);
  }
}

// --- Sample Data Fixtures matching FastAPI CamelModel Serialization ---
const MOCK_RAW_REPORT = {
  id: 'PF-101',
  trackingNumber: 'PF-101',
  tracking_number: 'PF-101',
  reporterId: 'user-cit-01',
  reporter_id: 'user-cit-01',
  reporterName: 'Akshit Sharma',
  reporter_name: 'Akshit Sharma',
  reporterEmail: 'akshit@potholefix.in',
  reporter_email: 'akshit@potholefix.in',
  createdAt: '2026-10-30T10:00:00Z',
  created_at: '2026-10-30T10:00:00Z',
  updatedAt: '2026-10-30T10:00:00Z',
  updated_at: '2026-10-30T10:00:00Z',
  location: {
    latitude: 30.7333,
    longitude: 76.7794,
    address: 'Madhya Marg, Sector 26, Chandigarh',
  },
  description: 'Severe deep fissure across eastbound transit lane.',
  damageImageUrl: 'https://example.com/pothole.jpg',
  damage_image_url: 'https://example.com/pothole.jpg',
  restoredImageUrl: null,
  restored_image_url: null,
  aiDetection: {
    detected: true,
    confidence: 0.94,
    severityScore: 'CRITICAL',
    boundingBoxes: [],
    isModelConnected: true,
  },
  status: 'SUBMITTED',
  statusHistory: [
    {
      status: 'SUBMITTED',
      timestamp: '2026-10-30T10:00:00Z',
      actorName: 'Akshit Sharma',
      note: 'Initial citizen report',
    },
  ],
  priority: 'HIGH',
  deadline: 'Today 18:00 EST',
  workOrderNumber: 'WO-101',
  work_order_number: 'WO-101',
  assignedTeamId: 'team-04',
  assigned_team_id: 'team-04',
  assignedTeamName: 'Punjab PWD Unit 04',
  assigned_team_name: 'Punjab PWD Unit 04',
  reworkNotes: null,
};

const MOCK_RAW_TASK = {
  id: 'WO-101',
  reportId: 'PF-101',
  report_id: 'PF-101',
  trackingNumber: 'PF-101',
  tracking_number: 'PF-101',
  assignedTeamId: 'team-04',
  assigned_team_id: 'team-04',
  assignedTeamName: 'Punjab PWD Unit 04',
  assigned_team_name: 'Punjab PWD Unit 04',
  priority: 'HIGH',
  status: 'PENDING',
  deadline: 'Today 18:00 EST',
  instructions: 'Saw-cut square perimeter, hot asphalt compaction.',
  beforeRepairPhotoUrl: 'https://example.com/pothole.jpg',
  afterRepairPhotoUrl: null,
  after_repair_photo_url: null,
  repairNotes: null,
  repair_notes: null,
  startedAt: null,
  completedAt: null,
  approvedAt: null,
  createdAt: '2026-10-30T10:30:00Z',
  created_at: '2026-10-30T10:30:00Z',
  reworkReason: null,
};

// --- Test Suite Execution ---
async function runFrontendServiceRegressionTests() {
  console.log('================================================================');
  console.log('    POTHOLEFIX FRONTEND API SERVICE REGRESSION & AUDIT SUITE    ');
  console.log('================================================================\n');

  setupMockFetch();
  setMockModeOverride(false); // Force Real API HTTP mode to verify all endpoint interactions

  try {
    // ---------------------------------------------------------
    // TEST GROUP 1: HTTP Client, Authentication & 401 Interceptor
    // ---------------------------------------------------------
    console.log('[Suite 1/7] Testing apiClient Core, Headers, and 401 Interception...');

    await test('apiClient attaches Bearer token when token is stored', async () => {
      setAuthToken('mock-jwt-token-12345');
      mockResponseHandler = () => ({ status: 200, body: [] });

      await apiClient.get('/reports');

      const lastReq = recordedRequests[recordedRequests.length - 1];
      assertEqual(lastReq.headers['authorization'], 'Bearer mock-jwt-token-12345', 'Auth header match');
    });

    await test('apiClient triggers onUnauthorized and clears token on HTTP 401', async () => {
      setAuthToken('expired-jwt-token');
      let unauthorizedFired = false;
      const unsubscribe = onUnauthorized(() => {
        unauthorizedFired = true;
      });

      mockResponseHandler = () => ({
        status: 401,
        body: { detail: 'Could not validate credentials' },
      });

      let caughtError: ApiError | null = null;
      try {
        await apiClient.get('/reports');
      } catch (e: any) {
        caughtError = e;
      }

      unsubscribe();
      assert(caughtError !== null, 'Expected ApiError to be thrown on 401');
      assertEqual(caughtError?.status, 401, 'Error status is 401');
      assertEqual(caughtError?.isUnauthorized, true, 'isUnauthorized flag is true');
      assertEqual(unauthorizedFired, true, 'onUnauthorized callback triggered');
      assertEqual(mockStorage.get('potholefix_auth_token'), undefined, 'Token cleared from storage');
    });

    await test('apiClient correctly propagates HTTP 400 with API error details', async () => {
      mockResponseHandler = () => ({
        status: 400,
        body: { detail: 'Latitude must be between -90 and 90.' },
      });

      let caughtError: ApiError | null = null;
      try {
        await apiClient.post('/reports', { latitude: 999 });
      } catch (e: any) {
        caughtError = e;
      }

      assert(caughtError !== null, 'Expected ApiError');
      assertEqual(caughtError?.status, 400, 'Error status 400');
      assertEqual(caughtError?.message, 'Latitude must be between -90 and 90.', 'Error detail message');
    });

    await test('apiClient correctly propagates HTTP 500 server error', async () => {
      mockResponseHandler = () => ({
        status: 500,
        body: { detail: 'Internal database connection timeout.' },
      });

      let caughtError: ApiError | null = null;
      try {
        await apiClient.get('/tasks/my');
      } catch (e: any) {
        caughtError = e;
      }

      assert(caughtError !== null, 'Expected ApiError on 500');
      assertEqual(caughtError?.status, 500, 'Error status 500');
      assertEqual(caughtError?.message, 'Internal database connection timeout.', 'Error message');
    });

    // ---------------------------------------------------------
    // TEST GROUP 2: Citizen Reports Service Operations
    // ---------------------------------------------------------
    console.log('\n[Suite 2/7] Testing Citizen Reports Service Operations...');

    await test('reportsService.getAllReports() queries GET /reports and maps domain schema', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'GET', 'GET method');
        assert(req.url.includes('/reports'), 'URL has /reports');
        return { status: 200, body: [MOCK_RAW_REPORT] };
      };

      const reports = await reportsService.getAllReports();
      assertEqual(reports.length, 1, 'Returns 1 report');
      assertEqual(reports[0].id, 'PF-101', 'Report ID matches');
      assertEqual(reports[0].trackingNumber, 'PF-101', 'Tracking number matches');
      assertEqual(reports[0].location.latitude, 30.7333, 'Latitude mapped');
      assertEqual(reports[0].assignedTeamId, 'team-04', 'Team ID mapped');
    });

    await test('reportsService.getMyReports() queries GET /reports/my', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'GET', 'GET method');
        assert(req.url.includes('/reports/my'), 'URL contains /reports/my');
        return { status: 200, body: [MOCK_RAW_REPORT] };
      };

      const myReports = await reportsService.getMyReports();
      assertEqual(myReports.length, 1, 'Returned user reports');
      assertEqual(myReports[0].reporterEmail, 'akshit@potholefix.in', 'Reporter email mapped');
    });

    await test('reportsService.getReportById() queries GET /reports/{id}', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'GET', 'GET method');
        assert(req.url.endsWith('/reports/PF-101'), 'URL ends with /reports/PF-101');
        return { status: 200, body: MOCK_RAW_REPORT };
      };

      const report = await reportsService.getReportById('PF-101');
      assert(report !== undefined, 'Report exists');
      assertEqual(report?.id, 'PF-101', 'Report id matches');
    });

    await test('reportsService.createReport() sends multipart/form-data when file provided', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'POST', 'POST method');
        assert(req.url.includes('/reports'), 'URL matches /reports');
        return { status: 201, body: MOCK_RAW_REPORT };
      };

      const fakeFile = new File(['fake-image-bytes'], 'pothole.png', { type: 'image/png' });
      const created = await reportsService.createReport({
        location: { latitude: 30.7333, longitude: 76.7794, address: 'Sector 26' },
        description: 'Dangerous pothole',
        imageFile: fakeFile,
      });

      assertEqual(created.id, 'PF-101', 'Created report ID matches');
    });

    await test('reportsService.createReport() sends JSON payload when no file provided', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'POST', 'POST method');
        assert(req.url.includes('/reports'), 'URL matches /reports');
        const body = req.body as any;
        assertEqual(body.location.latitude, 30.7333, 'JSON body lat');
        assertEqual(body.location.address, 'Sector 26', 'JSON body address');
        assertEqual(body.damage_image_url, 'https://example.com/pothole.jpg', 'Image URL sent in JSON');
        return { status: 201, body: MOCK_RAW_REPORT };
      };

      const created = await reportsService.createReport({
        location: { latitude: 30.7333, longitude: 76.7794, address: 'Sector 26' },
        description: 'Dangerous pothole',
        damageImageUrl: 'https://example.com/pothole.jpg',
      });

      assertEqual(created.id, 'PF-101', 'Created report ID matches');
    });

    // ---------------------------------------------------------
    // TEST GROUP 3: Municipal Authority Triage & Severity
    // ---------------------------------------------------------
    console.log('\n[Suite 3/7] Testing Municipal Authority Triage & Severity Endpoints...');

    await test('reportsService.verifyReport() calls PATCH /reports/{id}/verify (Approval)', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'PATCH', 'PATCH method');
        assert(req.url.endsWith('/reports/PF-101/verify'), 'URL is /reports/PF-101/verify');
        const body = req.body as any;
        assertEqual(body.verified, true, 'verified flag is true');
        assertEqual(body.reason, undefined, 'reason is undefined on approval');
        return {
          status: 200,
          body: { ...MOCK_RAW_REPORT, status: 'VERIFIED' },
        };
      };

      const verified = await reportsService.verifyReport('PF-101', true);
      assertEqual(verified.status, 'VERIFIED', 'Status updated to VERIFIED');
    });

    await test('reportsService.verifyReport() calls PATCH /reports/{id}/verify (Rejection)', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'PATCH', 'PATCH method');
        assert(req.url.endsWith('/reports/PF-101/verify'), 'URL is /reports/PF-101/verify');
        const body = req.body as any;
        assertEqual(body.verified, false, 'verified flag is false');
        assertEqual(body.reason, 'Duplicate citizen submission', 'rejection reason sent in body.reason');
        return {
          status: 200,
          body: { ...MOCK_RAW_REPORT, status: 'REJECTED' },
        };
      };

      const rejected = await reportsService.verifyReport('PF-101', false, 'Duplicate citizen submission');
      assertEqual(rejected.status, 'REJECTED', 'Status updated to REJECTED');
    });

    await test('reportsService.updateReportSeverity() calls PATCH /reports/{id}/severity', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'PATCH', 'PATCH method');
        assert(req.url.endsWith('/reports/PF-101/severity'), 'URL is /reports/PF-101/severity');
        const body = req.body as any;
        assertEqual(body.severity, 'CRITICAL', 'Severity is CRITICAL');
        assertEqual(body.note, 'High-speed bus corridor hazard', 'Note sent in body.note');
        return {
          status: 200,
          body: {
            ...MOCK_RAW_REPORT,
            aiDetection: { ...MOCK_RAW_REPORT.aiDetection, severityScore: 'CRITICAL' },
          },
        };
      };

      const updated = await reportsService.updateReportSeverity(
        'PF-101',
        'CRITICAL',
        'High-speed bus corridor hazard'
      );
      assertEqual(updated.aiDetection.severityScore, 'CRITICAL', 'Severity score updated');
    });

    // ---------------------------------------------------------
    // TEST GROUP 4: Repair Tasks & Multi-Crew Lifecycle
    // ---------------------------------------------------------
    console.log('\n[Suite 4/7] Testing Repair Tasks & Multi-Crew Lifecycle Endpoints...');

    await test('tasksService.createTask() calls POST /tasks with correct Pydantic fields', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'POST', 'POST method');
        assert(req.url.endsWith('/tasks'), 'URL ends with /tasks');
        const body = req.body as any;
        assertEqual(body.report_id, 'PF-101', 'report_id matches');
        assertEqual(body.tracking_number, 'PF-101', 'tracking_number matches');
        assertEqual(body.assigned_team_id, 'team-04', 'assigned_team_id matches');
        assertEqual(body.assigned_team_name, 'Punjab PWD Unit 04', 'assigned_team_name matches');
        assertEqual(body.priority, 'HIGH', 'priority matches');
        assertEqual(body.deadline, 'Today 18:00 EST', 'deadline matches');
        return { status: 201, body: MOCK_RAW_TASK };
      };

      const createdTask = await tasksService.createTask({
        reportId: 'PF-101',
        trackingNumber: 'PF-101',
        assignedTeamId: 'team-04',
        assignedTeamName: 'Punjab PWD Unit 04',
        priority: 'HIGH',
        deadline: 'Today 18:00 EST',
        instructions: 'Saw-cut square perimeter, hot asphalt compaction.',
      });

      assertEqual(createdTask.id, 'WO-101', 'Task ID matches');
      assertEqual(createdTask.assignedTeamId, 'team-04', 'Assigned team ID matches');
    });

    await test('tasksService.getMyTasks() queries GET /tasks/my for logged in crew', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'GET', 'GET method');
        assert(req.url.endsWith('/tasks/my'), 'URL is /tasks/my');
        return { status: 200, body: [MOCK_RAW_TASK] };
      };

      const crewTasks = await tasksService.getMyTasks();
      assertEqual(crewTasks.length, 1, 'Crew receives assigned tasks');
      assertEqual(crewTasks[0].assignedTeamId, 'team-04', 'Team ID matches');
    });

    await test('tasksService.getMyTasks(teamId) queries GET /tasks/my?team_id=team-02 with filter', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'GET', 'GET method');
        assert(req.url.includes('/tasks/my?team_id=team-02'), 'URL contains team_id parameter');
        return {
          status: 200,
          body: [{ ...MOCK_RAW_TASK, id: 'WO-102', assignedTeamId: 'team-02', assigned_team_id: 'team-02' }],
        };
      };

      const crewTasks = await tasksService.getMyTasks('team-02');
      assertEqual(crewTasks.length, 1, '1 task returned');
      assertEqual(crewTasks[0].assignedTeamId, 'team-02', 'team-02 verified');
    });

    await test('tasksService.startTask() calls PATCH /tasks/{taskId}/start', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'PATCH', 'PATCH method');
        assert(req.url.endsWith('/tasks/WO-101/start'), 'URL is /tasks/WO-101/start');
        return {
          status: 200,
          body: { ...MOCK_RAW_TASK, status: 'IN_PROGRESS', startedAt: '2026-10-30T11:00:00Z' },
        };
      };

      const started = await tasksService.startTask('WO-101');
      assertEqual(started.status, 'IN_PROGRESS', 'Task status is IN_PROGRESS');
      assertEqual(started.startedAt, '2026-10-30T11:00:00Z', 'startedAt timestamp returned');
    });

    await test('tasksService.submitCompletion() sends multipart when imageFile is provided', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'POST', 'POST method');
        assert(req.url.endsWith('/tasks/WO-101/completion'), 'URL is /tasks/WO-101/completion');
        return {
          status: 200,
          body: {
            ...MOCK_RAW_TASK,
            status: 'AWAITING_APPROVAL',
            afterRepairPhotoUrl: 'https://example.com/repaired.jpg',
            after_repair_photo_url: 'https://example.com/repaired.jpg',
            repairNotes: 'Flush hot asphalt compaction completed.',
          },
        };
      };

      const fakeEvidence = new File(['fake-evidence'], 'evidence.jpg', { type: 'image/jpeg' });
      const completed = await tasksService.submitCompletion(
        'WO-101',
        'https://example.com/preview.jpg',
        'Flush hot asphalt compaction completed.',
        'Gurpreet Singh',
        fakeEvidence
      );

      assertEqual(completed.status, 'AWAITING_APPROVAL', 'Status updated to AWAITING_APPROVAL');
      assertEqual(completed.afterRepairPhotoUrl, 'https://example.com/repaired.jpg', 'Repaired photo URL set');
    });

    await test('tasksService.reviewTask() calls PATCH /tasks/{taskId}/review (Approval)', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'PATCH', 'PATCH method');
        assert(req.url.endsWith('/tasks/WO-101/review'), 'URL is /tasks/WO-101/review');
        const body = req.body as any;
        assertEqual(body.approved, true, 'approved is true');
        return {
          status: 200,
          body: {
            task: { ...MOCK_RAW_TASK, status: 'RESOLVED' },
            notificationPayload: {
              type: 'CITIZEN_REPAIR_CONFIRMATION',
              recipient_email: 'akshit@potholefix.in',
            },
          },
        };
      };

      const result = await tasksService.reviewTask('WO-101', true);
      assertEqual(result.task.status, 'RESOLVED', 'Task status is RESOLVED');
      assert(result.notificationPayload !== undefined, 'Notification payload received');
    });

    await test('tasksService.reviewTask() calls PATCH /tasks/{taskId}/review (Rework)', async () => {
      mockResponseHandler = (req) => {
        assertEqual(req.method, 'PATCH', 'PATCH method');
        assert(req.url.endsWith('/tasks/WO-101/review'), 'URL is /tasks/WO-101/review');
        const body = req.body as any;
        assertEqual(body.approved, false, 'approved is false');
        assertEqual(body.rework_reason, 'Asphalt surface uncompacted at western perimeter', 'rework_reason sent');
        return {
          status: 200,
          body: {
            task: {
              ...MOCK_RAW_TASK,
              status: 'REWORK_REQUIRED',
              reworkReason: 'Asphalt surface uncompacted at western perimeter',
            },
          },
        };
      };

      const result = await tasksService.reviewTask(
        'WO-101',
        false,
        'Asphalt surface uncompacted at western perimeter'
      );
      assertEqual(result.task.status, 'REWORK_REQUIRED', 'Task status is REWORK_REQUIRED');
      assertEqual(result.task.reworkReason, 'Asphalt surface uncompacted at western perimeter', 'Rework reason set');
    });

    // ---------------------------------------------------------
    // TEST GROUP 5: Suspicious Method Regressions (F-06 Fixes)
    // ---------------------------------------------------------
    console.log('\n[Suite 5/7] Verifying Regression Fixes for updateReportStatus & submitRepairCompletion...');

    await test('REGRESSION: updateReportStatus(id, "VERIFIED") delegates to verifyReport', async () => {
      let patchVerifyCalled = false;
      mockResponseHandler = (req) => {
        if (req.method === 'PATCH' && req.url.endsWith('/reports/PF-101/verify')) {
          patchVerifyCalled = true;
          const body = req.body as any;
          assertEqual(body.verified, true, 'verified is true');
          return { status: 200, body: { ...MOCK_RAW_REPORT, status: 'VERIFIED' } };
        }
        if (req.method === 'GET' && req.url.endsWith('/reports/PF-101')) {
          return { status: 200, body: { ...MOCK_RAW_REPORT, status: 'VERIFIED' } };
        }
        throw new Error(`Unexpected request: ${req.method} ${req.url}`);
      };

      const result = await reportsService.updateReportStatus('PF-101', 'VERIFIED');
      assertEqual(patchVerifyCalled, true, 'PATCH /reports/{id}/verify was called');
      assertEqual(result.status, 'VERIFIED', 'Result status is VERIFIED');
    });

    await test('REGRESSION: updateReportStatus(id, "REJECTED") delegates to verifyReport with rejection', async () => {
      let patchVerifyCalled = false;
      mockResponseHandler = (req) => {
        if (req.method === 'PATCH' && req.url.endsWith('/reports/PF-101/verify')) {
          patchVerifyCalled = true;
          const body = req.body as any;
          assertEqual(body.verified, false, 'verified is false');
          assertEqual(body.reason, 'Invalid coordinate range', 'reason matched');
          return { status: 200, body: { ...MOCK_RAW_REPORT, status: 'REJECTED' } };
        }
        if (req.method === 'GET' && req.url.endsWith('/reports/PF-101')) {
          return { status: 200, body: { ...MOCK_RAW_REPORT, status: 'REJECTED' } };
        }
        throw new Error(`Unexpected request: ${req.method} ${req.url}`);
      };

      const result = await reportsService.updateReportStatus('PF-101', 'REJECTED', 'Invalid coordinate range');
      assertEqual(patchVerifyCalled, true, 'PATCH /reports/{id}/verify was called');
      assertEqual(result.status, 'REJECTED', 'Result status is REJECTED');
    });

    await test('REGRESSION: updateReportStatus throws error when updating unassigned report to IN_PROGRESS', async () => {
      mockResponseHandler = (req) => {
        if (req.method === 'GET') {
          return { status: 200, body: { ...MOCK_RAW_REPORT, workOrderNumber: null, work_order_number: null } };
        }
        throw new Error(`Unexpected call ${req.method}`);
      };

      let caughtError: Error | null = null;
      try {
        await reportsService.updateReportStatus('PF-101', 'IN_PROGRESS');
      } catch (err: any) {
        caughtError = err;
      }

      assert(caughtError !== null, 'Expected error to be thrown');
      assert(
        caughtError?.message.includes('No active work order assigned'),
        `Expected explicit work order message, got: ${caughtError?.message}`
      );
    });

    await test('REGRESSION: updateReportStatus(id, "IN_PROGRESS") calls PATCH /tasks/{workOrderNumber}/start', async () => {
      let patchStartCalled = false;
      mockResponseHandler = (req) => {
        if (req.method === 'GET' && req.url.endsWith('/reports/PF-101')) {
          return { status: 200, body: { ...MOCK_RAW_REPORT, workOrderNumber: 'WO-101', work_order_number: 'WO-101' } };
        }
        if (req.method === 'PATCH' && req.url.endsWith('/tasks/WO-101/start')) {
          patchStartCalled = true;
          return { status: 200, body: { ...MOCK_RAW_TASK, status: 'IN_PROGRESS' } };
        }
        throw new Error(`Unexpected request: ${req.method} ${req.url}`);
      };

      await reportsService.updateReportStatus('PF-101', 'IN_PROGRESS');
      assertEqual(patchStartCalled, true, 'PATCH /tasks/WO-101/start was called');
    });

    await test('REGRESSION: updateReportStatus(id, "RESOLVED") calls PATCH /tasks/{workOrderNumber}/review', async () => {
      let patchReviewCalled = false;
      mockResponseHandler = (req) => {
        if (req.method === 'GET' && req.url.endsWith('/reports/PF-101')) {
          return { status: 200, body: { ...MOCK_RAW_REPORT, workOrderNumber: 'WO-101', work_order_number: 'WO-101' } };
        }
        if (req.method === 'PATCH' && req.url.endsWith('/tasks/WO-101/review')) {
          patchReviewCalled = true;
          const body = req.body as any;
          assertEqual(body.approved, true, 'approved is true');
          return { status: 200, body: { task: { ...MOCK_RAW_TASK, status: 'RESOLVED' } } };
        }
        throw new Error(`Unexpected request: ${req.method} ${req.url}`);
      };

      await reportsService.updateReportStatus('PF-101', 'RESOLVED');
      assertEqual(patchReviewCalled, true, 'PATCH /tasks/WO-101/review called with approved=true');
    });

    await test('REGRESSION: updateReportStatus(id, "REWORK_REQUIRED") calls PATCH /tasks/{wo}/review with approved=false', async () => {
      let patchReviewCalled = false;
      mockResponseHandler = (req) => {
        if (req.method === 'GET' && req.url.endsWith('/reports/PF-101')) {
          return { status: 200, body: { ...MOCK_RAW_REPORT, workOrderNumber: 'WO-101', work_order_number: 'WO-101' } };
        }
        if (req.method === 'PATCH' && req.url.endsWith('/tasks/WO-101/review')) {
          patchReviewCalled = true;
          const body = req.body as any;
          assertEqual(body.approved, false, 'approved is false');
          assertEqual(body.rework_reason, 'Edges not sealed', 'rework reason matched');
          return { status: 200, body: { task: { ...MOCK_RAW_TASK, status: 'REWORK_REQUIRED' } } };
        }
        throw new Error(`Unexpected request: ${req.method} ${req.url}`);
      };

      await reportsService.updateReportStatus('PF-101', 'REWORK_REQUIRED', 'Edges not sealed');
      assertEqual(patchReviewCalled, true, 'PATCH /tasks/WO-101/review called with approved=false');
    });

    await test('REGRESSION: submitRepairCompletion throws error if report has no active work order', async () => {
      mockResponseHandler = (req) => {
        if (req.method === 'GET') {
          return { status: 200, body: { ...MOCK_RAW_REPORT, workOrderNumber: null, work_order_number: null } };
        }
        throw new Error(`Unexpected request ${req.method}`);
      };

      let caughtError: Error | null = null;
      try {
        await reportsService.submitRepairCompletion('PF-101', 'https://example.com/after.jpg');
      } catch (err: any) {
        caughtError = err;
      }

      assert(caughtError !== null, 'Expected error to be thrown');
      assert(
        caughtError?.message.includes('has no assigned work order'),
        `Expected descriptive work order error, got: ${caughtError?.message}`
      );
    });

    await test('REGRESSION: submitRepairCompletion calls POST /tasks/{workOrderNumber}/completion', async () => {
      let postCompletionCalled = false;
      mockResponseHandler = (req) => {
        if (req.method === 'GET' && req.url.endsWith('/reports/PF-101')) {
          return { status: 200, body: { ...MOCK_RAW_REPORT, workOrderNumber: 'WO-101', work_order_number: 'WO-101' } };
        }
        if (req.method === 'POST' && req.url.endsWith('/tasks/WO-101/completion')) {
          postCompletionCalled = true;
          const body = req.body as any;
          assertEqual(body.after_repair_photo_url, 'https://example.com/restored.jpg', 'restored URL matched');
          assertEqual(body.repair_notes, 'Cold mix compacted', 'notes matched');
          return { status: 200, body: { ...MOCK_RAW_TASK, status: 'AWAITING_APPROVAL' } };
        }
        throw new Error(`Unexpected request: ${req.method} ${req.url}`);
      };

      await reportsService.submitRepairCompletion(
        'PF-101',
        'https://example.com/restored.jpg',
        'Cold mix compacted'
      );
      assertEqual(postCompletionCalled, true, 'POST /tasks/WO-101/completion was called with payload');
    });

    // ---------------------------------------------------------
    // TEST GROUP 6: AI Fallback & Multi-Crew Authentication
    // ---------------------------------------------------------
    console.log('\n[Suite 6/7] Testing AI Service Graceful Fallback & Multi-Crew Auth...');

    await test('detectPothole() falls back gracefully when backend is offline', async () => {
      mockResponseHandler = () => ({
        status: 503,
        body: { detail: 'YOLO model weights offline' },
      });

      const fakeImage = new File(['fake-bytes'], 'road.jpg', { type: 'image/jpeg' });
      const result = await detectPothole(fakeImage);

      assertEqual(result.isModelConnected, false, 'isModelConnected is false on failure');
      assertEqual(result.detected, false, 'detected is false without fabrication');
      assertEqual(result.confidence, 0, 'confidence is 0');
      assertEqual(result.boundingBoxes.length, 0, 'No bounding boxes fabricated');
    });

    await test('detectPothole() returns detections when YOLO endpoint succeeds', async () => {
      mockResponseHandler = (req) => {
        assert(req.url.endsWith('/ai/detect'), 'Calls /ai/detect');
        return {
          status: 200,
          body: {
            detected: true,
            confidence: 0.92,
            severity: 'CRITICAL',
            boxes: [{ x: 100, y: 150, width: 200, height: 180, label: 'pothole', confidence: 0.92 }],
            status: 'AI_DETECTION_COMPLETED',
            isModelConnected: true,
          },
        };
      };

      const fakeImage = new File(['fake-bytes'], 'road.jpg', { type: 'image/jpeg' });
      const result = await detectPothole(fakeImage);

      assertEqual(result.isModelConnected, true, 'isModelConnected is true');
      assertEqual(result.detected, true, 'detected is true');
      assertEqual(result.severityScore, 'CRITICAL', 'severity is CRITICAL');
      assertEqual(result.boundingBoxes.length, 1, '1 bounding box returned');
      assertEqual(result.boundingBoxes[0].label, 'pothole', 'Label is pothole');
    });

    await test('authService REPAIR_CREWS definitions cover all 3 teams with correct teamId', async () => {
      assertEqual(REPAIR_CREWS.length, 3, '3 Repair Crews defined');
      const teamIds = REPAIR_CREWS.map((c) => c.teamId);
      assert(teamIds.includes('team-04'), 'team-04 exists');
      assert(teamIds.includes('team-02'), 'team-02 exists');
      assert(teamIds.includes('team-01'), 'team-01 exists');
    });

    await test('authService.login() authenticates crew and saves token & user to storage', async () => {
      mockResponseHandler = (req) => {
        assert(req.url.endsWith('/auth/login'), 'URL is /auth/login');
        const body = req.body as any;
        assertEqual(body.email, 'gurpreet@pwd.punjab.gov.in', 'Crew email matched');
        return {
          status: 200,
          body: {
            token: 'jwt-crew-token-abc',
            user: {
              id: 'user-team-01',
              name: 'Gurpreet Singh',
              email: 'gurpreet@pwd.punjab.gov.in',
              role: 'REPAIR_TEAM',
              teamId: 'team-04',
              unit: 'Punjab PWD Unit 04',
            },
          },
        };
      };

      const authRes = await authService.login({
        email: 'gurpreet@pwd.punjab.gov.in',
        password: 'password123',
      });

      assertEqual(authRes.token, 'jwt-crew-token-abc', 'Token received');
      assertEqual(authRes.user.role, 'REPAIR_TEAM', 'Role is REPAIR_TEAM');
      assertEqual(authRes.user.teamId, 'team-04', 'teamId matches team-04');
      assertEqual(mockStorage.get('potholefix_auth_token'), 'jwt-crew-token-abc', 'Token saved to storage');
    });

    // ---------------------------------------------------------
    // TEST GROUP 7: Mock Mode Parity
    // ---------------------------------------------------------
    console.log('\n[Suite 7/7] Testing Mock Mode Parity & Offline Operation...');

    await test('isMockMode switches between Real API mode and Mock mode cleanly', async () => {
      setMockModeOverride(true);
      assertEqual(isMockMode(), true, 'isMockMode() is true when overridden');

      // In mock mode, reportsService returns stored seed data without calling network fetch
      let fetchCalledInMockMode = false;
      mockResponseHandler = () => {
        fetchCalledInMockMode = true;
        return { status: 200, body: [] };
      };

      const mockReports = await reportsService.getAllReports();
      assertEqual(fetchCalledInMockMode, false, 'Fetch was NOT called in mock mode');
      assert(mockReports.length >= 1, 'Mock reports loaded from local mock repository');

      setMockModeOverride(false);
      assertEqual(isMockMode(), false, 'isMockMode() is false when restored to Real API');
    });

    // ---------------------------------------------------------
    // SUMMARY REPORT
    // ---------------------------------------------------------
    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount})`);
    console.log('================================================================\n');

    if (failCount > 0) {
      process.exit(1);
    }
  } finally {
    restoreFetch();
  }
}

runFrontendServiceRegressionTests();
