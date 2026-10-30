# PotholeFix — FastAPI Municipal Backend

Production-ready, type-safe REST API backend for the **PotholeFix** AI pothole detection, citizen reporting, and road repair management platform.

---

## 1. Architecture & Tech Stack

* **Framework:** FastAPI (Python 3.10+)
* **Database:** SQLite with SQLAlchemy ORM (ACID transactions, persistent `potholefix.db`)
* **Data Validation:** Pydantic v2 (CamelCase & snake_case dual serialization)
* **Authentication:** JWT Bearer tokens with signed cryptographic claims & bcrypt password hashing
* **File Uploads:** `python-multipart` with 10 MB size limits, MIME type verification, and path traversal prevention
* **Static Storage:** Mounted `/uploads` directory for damage & restoration photo evidence

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

### Step 3: Run the Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation will be available at:
* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

---

## 3. Seed Accounts & Baseline Data

Upon first startup, the database is automatically seeded with development credentials:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Citizen** | Alex Rivera | `alex.rivera@community.org` | `password123` |
| **Authority** | Director Sarah Chen | `s.chen@publicworks.gov` | `password123` |
| **Repair Team** | Marcus Vance (`team-04`) | `m.vance@asphalt-unit04.city` | `password123` |

Baseline Stitch reports (`#PF-098`, `#PF-104`, `#PF-108`, `#PF-112`) and work orders (`WO-88421`, `WO-88429`, `WO-88435`) are automatically pre-populated.

---

## 4. Running Automated Tests

Run the test suite verifying all 15 core lifecycle and security criteria:
```bash
pytest tests/ -v
```

---

## 5. Endpoints Reference

### Authentication
* `POST /auth/signup` — Public citizen registration
* `POST /auth/login` — Sign in with email and password
* `GET /auth/me` — Authenticated profile verification

### Computer Vision (YOLO)
* `POST /ai/detect` — Accepts multipart road photograph; returns detection state (clean `AI_UNAVAILABLE` fallback when YOLO model is offline)

### Reports
* `POST /reports` — Citizen submits hazard with coordinates and image
* `GET /reports/my` — Citizen's personal submissions
* `GET /reports` — Authority triage queue with status and severity filters
* `GET /reports/{id}` — Single report detail
* `PATCH /reports/{id}/verify` — Authority marks report `VERIFIED` or `REJECTED`

### Work Orders & Tasks
* `POST /tasks` — Authority dispatches verified report to field crew
* `GET /tasks/my` — Work orders assigned to authenticated crew lead
* `GET /tasks` — All municipal work orders
* `GET /tasks/{id}` — Work order details
* `PATCH /tasks/{id}/start` — Field crew logs on-site arrival (`IN_PROGRESS`)
* `POST /tasks/{id}/completion` — Crew uploads post-repair photo evidence (`AWAITING_APPROVAL`)
* `GET /authority/approvals` — Authority queue of repairs awaiting certification
* `PATCH /tasks/{id}/review` — Authority approves repair (`RESOLVED`) or requests rework (`REWORK_REQUIRED`)
