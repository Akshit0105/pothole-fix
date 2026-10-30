# Frontend & Backend Integration Guide

This guide describes how to run and connect **PotholeFix** against the FastAPI backend, test endpoints, toggle between Mock and Real API modes, and verify contracts.

---

## 1. Environment Configuration

The frontend environment is controlled by Vite environment variables located in `.env` (or `.env.local`):

```ini
# Base URL of the FastAPI Backend
VITE_API_BASE_URL=http://localhost:8000

# Mode Toggle:
# 'true'  -> Uses development localStorage mock repository (Judge Fast-Switch enabled)
# 'false' -> Uses live HTTP endpoints via apiClient (No mock fallbacks, real errors displayed)
VITE_USE_MOCK_DATA=true
```

### Modes Explained
1. **Mock Mode (`VITE_USE_MOCK_DATA=true`):**
   * Pre-seeded with authentic baseline demo reports (`#PF-098`, `#PF-104`, `#PF-108`, `#PF-112`).
   * Complete lifecycle testable locally without running Python or database.
   * Top Judge Fast-Switch enables instant role switching between `Citizen (Alex Rivera)`, `Authority (Director Sarah Chen)`, and `Crew Lead (Marcus Vance)`.
2. **Real API Mode (`VITE_USE_MOCK_DATA=false`):**
   * Disables localStorage mocks completely.
   * All queries and mutations dispatch real HTTP calls (`GET`, `POST`, `PATCH`, `multipart/form-data`) via `src/services/apiClient.ts`.
   * Clear error banners are displayed if the backend is offline or returns error codes (`401`, `404`, `500`).
   * Authentication attaches `Authorization: Bearer <token>` from `localStorage.getItem('potholefix_auth_token')`.

---

## 2. Architecture & Service Dispatch

All React UI components communicate exclusively with unified service wrappers:
```
React Components (UI)
       │
       ├──> reportsService
       ├──> tasksService
       ├──> authService
       └──> aiDetectionService
               │
               ▼
   [isMockMode() check]
        ├── True  ──> LocalStorage Mock Repository
        └── False ──> apiClient (HTTP requests to FastAPI)
```

No UI component has hardcoded URLs, and none performs direct `fetch` calls. Switching between mock and real mode requires zero changes to UI components.

---

## 3. Step-by-Step Backend Developer Verification

### Step 1: Start your FastAPI Server
Ensure your backend is running on `http://localhost:8000`:
```bash
uvicorn main:app --reload --port 8000
```
Verify the health check or interactive docs at `http://localhost:8000/docs`.

### Step 2: Configure Frontend for Real API
In `C:\Users\DELL\.gemini\antigravity\scratch\potholefix\.env`:
```ini
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_DATA=false
```

### Step 3: Run the Frontend
```powershell
npm run dev
```
Open `http://localhost:5173`.

### Step 4: Verify Lifecycle Handshake
1. **Sign In (`POST /auth/login`):**
   * Sign in with a citizen, authority, or crew account.
   * Inspect Network tab: Check that `token` is returned and stored.
2. **Report a Pothole (`POST /ai/detect` and `POST /reports`):**
   * Upload an image on `/citizen/report`.
   * Check that AI bounding boxes and confidence score from your YOLO model render over the image preview.
   * Submit report; confirm backend responds with `id` and `tracking_number`.
3. **Authority Verification (`PATCH /reports/{id}/verify`):**
   * Sign in as Authority (`Director Sarah Chen`).
   * Locate the report in `/authority/reports`.
   * Click **Verify Report**; confirm status transitions to `VERIFIED`.
4. **Dispatch Task (`POST /tasks`):**
   * Click **Assign Repair Crew**; choose `Asphalt Unit 04`, set priority and instructions.
   * Confirm backend creates work order (`WO-xxxxx`).
5. **Field Repair Execution (`PATCH /tasks/{id}/start` & `POST /tasks/{id}/completion`):**
   * Sign in as Crew Lead (`Marcus Vance`).
   * Open `/team/tasks`; click **Start Repair** (`IN_PROGRESS`).
   * Upload after-repair photograph; click **Submit for Authority Approval** (`AWAITING_APPROVAL`).
6. **Final Resolution (`PATCH /tasks/{id}/review`):**
   * Return to Authority `/authority/approvals`.
   * Inspect before/after photo comparison; click **Approve & Mark Resolved**.
   * Switch back to Citizen: Confirm report is marked `RESOLVED` and displays the verified restoration photograph.

---

## 4. Backend Developer Handoff Checklist

Share this checklist directly with the backend engineer:

- [ ] **CORS Configuration:** Enable CORS for `http://localhost:5173` and `http://localhost:5174` (allow credentials, `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`, and headers `Authorization`, `Content-Type`).
- [ ] **JWT Authentication:**
  - [ ] `POST /auth/login` accepts `{ email, password }` and returns `{ token, token_type, user }`.
  - [ ] `POST /auth/signup` accepts `{ name, email, password, role }` and returns `{ token, token_type, user }`.
  - [ ] `GET /auth/me` validates `Bearer <token>` and returns user details.
- [ ] **YOLO Model (`POST /ai/detect`):**
  - [ ] Accepts multipart `file`.
  - [ ] Returns `{ detected: bool, confidence: float, severity: str, boxes: [...] }`.
  - [ ] If model is uninitialized, returns empty boxes or 503 (frontend handles gracefully).
- [ ] **Citizen Reporting (`POST /reports`):**
  - [ ] Accepts multipart with image or JSON payload.
  - [ ] Stores latitude, longitude (numeric floats), address, and description.
  - [ ] Generates unique tracking number (e.g. `PF-xxx`).
- [ ] **Authority Endpoints:**
  - [ ] `GET /reports` (supports status/severity filters).
  - [ ] `PATCH /reports/{id}/verify` (updates status to `VERIFIED` or `REJECTED`).
  - [ ] `POST /tasks` (creates work order `WO-xxx` assigned to a team).
  - [ ] `GET /authority/approvals` (returns tasks awaiting sign-off).
  - [ ] `PATCH /tasks/{id}/review` (transitions work order and report to `RESOLVED` or `REWORK_REQUIRED`).
- [ ] **Repair Crew Endpoints:**
  - [ ] `GET /tasks/my` (returns work orders assigned to current crew).
  - [ ] `PATCH /tasks/{id}/start` (updates status to `IN_PROGRESS`).
  - [ ] `POST /tasks/{id}/completion` (accepts multipart after-repair image and notes).
- [ ] **Email Dispatch:**
  - [ ] Background worker handles email dispatch when report reaches `RESOLVED` status (frontend triggers no client-side SMTP).
