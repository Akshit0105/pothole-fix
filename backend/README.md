# PotholeFix — FastAPI Municipal Backend

Production-ready, type-safe REST API backend for the **PotholeFix** AI pothole detection, citizen reporting, and municipal road repair management platform.

---

## 1. Architecture & Tech Stack

* **Framework:** FastAPI (Python 3.10+)
* **Database:** Supabase PostgreSQL with SQLAlchemy 2.0 ORM (with automatic fallback to SQLite `potholefix.db`)
* **Connection Pooling:** NullPool optimized for Supabase Transaction Pooler (port 6543) and SSL enforcement
* **Object Storage:** Supabase Storage (private buckets: `pothole-images`, `repair-evidence`) with short-lived signed URLs and local `/uploads` fallback
* **Data Validation:** Pydantic v2 (CamelCase & snake_case dual serialization)
* **Authentication:** JWT Bearer tokens with signed cryptographic claims & bcrypt password hashing
* **File Uploads:** `python-multipart` with 10 MB size limits, MIME type verification, and path traversal prevention
* **AI / Computer Vision:** YOLO integration with graceful offline `AI_UNAVAILABLE` fallback

---

## 2. Quickstart & Installation

### Step 1: Create and Activate Virtual Environment
```bash
cd backend
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
source .venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase connection parameters:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
STORAGE_BACKEND=supabase
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_POTHOLE_BUCKET=pothole-images
SUPABASE_REPAIR_BUCKET=repair-evidence
```

### Step 4: Run the Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation will be available at:
* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

---

## 3. Seed Accounts & Baseline Data

Seed data seeding is non-destructive and controlled via `SEED_DEMO_DATA=True`. Standard demo accounts:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Citizen** | Akshit Sharma | `akshit@potholefix.in` | `password123` |
| **Citizen** | Harjot Singh | `harjot@potholefix.in` | `password123` |
| **Authority** | Alice Sharma | `alice@potholefix.gov.in` | `password123` |
| **Repair Team** | Gurpreet Singh (`team-04`) | `gurpreet@pwd.punjab.gov.in` | `password123` |

Baseline Indian demo reports (`#PF-101`, `#PF-102`, `#PF-103`) are preserved and never automatically overwritten.

---

## 4. Running Automated Tests

Run the comprehensive lifecycle, security, and integrity test suite:
```bash
pytest tests/test_lifecycle_and_security.py -v
```

---

## 5. Endpoints Reference

### Authentication
* `POST /auth/signup` — Public citizen registration (strictly forces `CITIZEN` role)
* `POST /auth/login` — Sign in with email and password (issues JWT token)
* `GET /auth/me` — Authenticated profile verification

### Computer Vision (YOLO)
* `POST /ai/detect` — Accepts multipart road photograph; runs live YOLO or returns clean `AI_UNAVAILABLE` fallback

### Reports
* `POST /reports` — Citizen submits hazard with coordinates and image (persists to Supabase Storage)
* `GET /reports/my` — Citizen's personal submissions
* `GET /reports` — Authority triage queue with status and severity filters
* `GET /reports/{id}` — Single report detail (strictly authorizes owner, authority, or assigned team)
* `PATCH /reports/{id}/verify` — Authority marks report `VERIFIED` or `REJECTED`
* `POST /reports/reset-demo` — Resets seed demo reports (strictly restricted to development mode)

### Work Orders & Tasks
* `POST /tasks` — Authority dispatches verified report to field crew
* `GET /tasks/my` — Work orders assigned to authenticated crew lead
* `GET /tasks` — All municipal work orders
* `GET /tasks/{id}` — Work order details
* `PATCH /tasks/{id}/start` — Assigned crew logs on-site arrival (`IN_PROGRESS`; unassigned crews rejected)
* `POST /tasks/{id}/completion` — Assigned crew uploads post-repair photo evidence (`AWAITING_APPROVAL`)
* `GET /authority/approvals` — Authority queue of repairs awaiting certification
* `GET /authority/tasks` — Authority overview of all tasks
* `PATCH /tasks/{id}/review` — Authority approves repair (`RESOLVED`) or requests rework (`REWORK_REQUIRED`)

### Storage
* `GET /storage/image/{bucket}/{filename}` — Authenticated proxy for streaming private images
