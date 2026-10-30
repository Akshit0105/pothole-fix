import io
import time
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import User, Report, Task, RepairEvidence, StatusHistory, NotificationEvent
from app.services.storage import delete_uploaded_image, get_supabase_client
from app.security import get_password_hash

client = TestClient(app)

DUMMY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00"
    b"\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)

@pytest.fixture(scope="module")
def authority_auth():
    """Provides authenticated Authority user token."""
    res = client.post("/auth/login", json={
        "email": "alice@potholefix.gov.in",
        "password": "password123"
    })
    assert res.status_code == 200
    return res.json()["token"]

@pytest.fixture(scope="module")
def assigned_crew_auth():
    """Provides authenticated Repair Crew (team-04) user token."""
    res = client.post("/auth/login", json={
        "email": "gurpreet@pwd.punjab.gov.in",
        "password": "password123"
    })
    assert res.status_code == 200
    return res.json()["token"]

@pytest.fixture(scope="module")
def unassigned_crew_auth():
    """Creates a temporary unassigned crew user belonging to team-99."""
    db = SessionLocal()
    unassigned_email = f"crew99_{int(time.time())}@pwd.test"
    crew_user = User(
        name="Test Crew Unassigned",
        email=unassigned_email,
        password_hash=get_password_hash("password123"),
        role="REPAIR_TEAM",
        team_id="team-99",
        unit="PWD Flying Squad 99"
    )
    db.add(crew_user)
    db.commit()
    db.refresh(crew_user)
    db.close()

    res = client.post("/auth/login", json={
        "email": unassigned_email,
        "password": "password123"
    })
    assert res.status_code == 200
    token = res.json()["token"]
    yield token

    # Cleanup
    db = SessionLocal()
    db.query(User).filter(User.email == unassigned_email).delete()
    db.commit()
    db.close()

def test_01_citizen_registration_and_login():
    """PHASE 2.1 & 2.2: Citizen signup, password hashing, duplicate check, and login."""
    unique_email = f"lifecycle_citizen_{int(time.time() * 1000)}@test.in"
    
    # 1. Signup
    signup_res = client.post("/auth/signup", json={
        "name": "Priya Sharma",
        "email": unique_email,
        "password": "SecurePassword#2026",
        "role": "AUTHORITY" # Attack: public signup trying to claim AUTHORITY
    })
    assert signup_res.status_code == 201
    auth_data = signup_res.json()
    assert auth_data["user"]["role"] == "CITIZEN" # Enforces CITIZEN
    assert auth_data["user"]["email"] == unique_email
    assert "token" in auth_data

    # 2. Duplicate registration rejection
    dup_res = client.post("/auth/signup", json={
        "name": "Priya Sharma",
        "email": unique_email,
        "password": "SecurePassword#2026"
    })
    assert dup_res.status_code == 409

    # 3. Valid Login
    login_res = client.post("/auth/login", json={
        "email": unique_email,
        "password": "SecurePassword#2026"
    })
    assert login_res.status_code == 200
    assert "token" in login_res.json()

    # 4. Invalid credentials rejection
    bad_login = client.post("/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword999"
    })
    assert bad_login.status_code == 401

def test_02_pothole_reporting_and_invalid_rejections(authority_auth):
    """PHASE 2.3: Pothole report upload, storage persistence, and validation guards."""
    citizen_email = f"reporter_{int(time.time() * 1000)}@test.in"
    s_res = client.post("/auth/signup", json={
        "name": "Simran Kaur",
        "email": citizen_email,
        "password": "password123"
    })
    citizen_token = s_res.json()["token"]

    # 1. Reject invalid file format
    invalid_file = io.BytesIO(b"not an image file")
    bad_file_res = client.post(
        "/reports",
        files={"file": ("malicious.sh", invalid_file, "application/x-sh")},
        data={"latitude": 30.73, "longitude": 76.78, "address": "Test Road"},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert bad_file_res.status_code == 400

    # 2. Reject out-of-range coordinates
    valid_file = io.BytesIO(DUMMY_PNG)
    bad_coord_res = client.post(
        "/reports",
        files={"file": ("pothole.png", valid_file, "image/png")},
        data={"latitude": 95.0, "longitude": 76.78, "address": "Out of Range"},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert bad_coord_res.status_code == 400

    # 3. Successful report creation with sample image
    valid_file_2 = io.BytesIO(DUMMY_PNG)
    report_res = client.post(
        "/reports",
        files={"file": ("pothole_verified.png", valid_file_2, "image/png")},
        data={
            "latitude": 30.7350,
            "longitude": 76.7820,
            "address": "Madhya Marg Crossing, Chandigarh",
            "description": "Severe road cavity obstructing vehicular traffic."
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert report_res.status_code == 201
    rep = report_res.json()
    assert rep["status"] == "SUBMITTED"
    assert rep["damageImageUrl"].startswith("http") # Signed URL or base URL
    report_id = rep["id"]

    # Verify persistent DB record contains stable storage reference
    db = SessionLocal()
    db_rep = db.query(Report).filter(Report.id == report_id).first()
    assert db_rep is not None
    if settings.STORAGE_BACKEND == "supabase":
        assert db_rep.image_path.startswith("supabase://pothole-images/")
    assert db_rep.status == "SUBMITTED"
    db.close()

    # 4. Report retrieval: citizen sees own report
    my_reports = client.get("/reports/my", headers={"Authorization": f"Bearer {citizen_token}"})
    assert my_reports.status_code == 200
    my_ids = [r["id"] for r in my_reports.json()]
    assert report_id in my_ids

    # 5. Access control: other citizens cannot view this report
    other_signup = client.post("/auth/signup", json={
        "name": "Other Citizen",
        "email": f"other_{int(time.time() * 1000)}@test.in",
        "password": "password123"
    })
    other_token = other_signup.json()["token"]
    forbidden_res = client.get(f"/reports/{report_id}", headers={"Authorization": f"Bearer {other_token}"})
    assert forbidden_res.status_code == 403

def test_03_complete_municipal_and_repair_lifecycle(authority_auth, assigned_crew_auth, unassigned_crew_auth):
    """
    PHASE 2.4 - 2.10: Complete workflow from submission -> verification -> assignment
    -> start -> completion -> approval -> notifications.
    """
    # 1. Citizen submits report
    citizen_email = f"flow_citizen_{int(time.time() * 1000)}@test.in"
    c_res = client.post("/auth/signup", json={
        "name": "Gagandeep Singh",
        "email": citizen_email,
        "password": "password123"
    })
    citizen_token = c_res.json()["token"]

    img_stream = io.BytesIO(DUMMY_PNG)
    create_res = client.post(
        "/reports",
        files={"file": ("pothole_flow.png", img_stream, "image/png")},
        data={
            "latitude": 30.7410,
            "longitude": 76.7750,
            "address": "Himalaya Marg, Chandigarh",
            "description": "Deep asphalt failure on north-bound lane."
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert create_res.status_code == 201
    report_id = create_res.json()["id"]

    # 2. Citizen cannot verify report (RBAC check)
    c_verify = client.patch(
        f"/reports/{report_id}/verify",
        json={"verified": True},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert c_verify.status_code == 403

    # 3. Authority verifies the report
    auth_verify = client.patch(
        f"/reports/{report_id}/verify",
        json={"verified": True, "reason": "Photographic damage confirmed by inspector."},
        headers={"Authorization": f"Bearer {authority_auth}"}
    )
    assert auth_verify.status_code == 200
    assert auth_verify.json()["status"] == "VERIFIED"

    # 4. Authority assigns work order to team-04
    task_res = client.post(
        "/tasks",
        json={
            "report_id": report_id,
            "assigned_team_id": "team-04",
            "assigned_team_name": "Punjab PWD Unit 04",
            "priority": "HIGH",
            "deadline": "Today 18:00 IST",
            "instructions": "Saw-cut rectangular perimeter and vibratory roller flush pass."
        },
        headers={"Authorization": f"Bearer {authority_auth}"}
    )
    assert task_res.status_code == 201
    task_data = task_res.json()
    task_id = task_data["id"]
    assert task_data["status"] == "PENDING"
    assert task_data["assignedTeamId"] == "team-04"

    # 5. Security: Unassigned crew (team-99) CANNOT start or modify task
    unassigned_start = client.patch(
        f"/tasks/{task_id}/start",
        headers={"Authorization": f"Bearer {unassigned_crew_auth}"}
    )
    assert unassigned_start.status_code == 403

    # 6. Assigned crew (team-04) starts task
    assigned_start = client.patch(
        f"/tasks/{task_id}/start",
        headers={"Authorization": f"Bearer {assigned_crew_auth}"}
    )
    assert assigned_start.status_code == 200
    assert assigned_start.json()["status"] == "IN_PROGRESS"

    # 7. Security: Unassigned crew CANNOT submit completion evidence
    evi_stream_bad = io.BytesIO(DUMMY_PNG)
    unassigned_comp = client.post(
        f"/tasks/{task_id}/completion",
        files={"file": ("evidence_bad.png", evi_stream_bad, "image/png")},
        data={"repair_notes": "Attempt by wrong crew"},
        headers={"Authorization": f"Bearer {unassigned_crew_auth}"}
    )
    assert unassigned_comp.status_code == 403

    # 8. Assigned crew submits completion evidence
    evi_stream = io.BytesIO(DUMMY_PNG)
    comp_res = client.post(
        f"/tasks/{task_id}/completion",
        files={"file": ("evidence_comp.png", evi_stream, "image/png")},
        data={"repair_notes": "Flush hot-mix asphalt compaction completed with asphalt seam sealer."},
        headers={"Authorization": f"Bearer {assigned_crew_auth}"}
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "AWAITING_APPROVAL"

    # Verify evidence in repair-evidence bucket and DB
    db = SessionLocal()
    db_evi = db.query(RepairEvidence).filter(RepairEvidence.task_id == task_id).first()
    assert db_evi is not None
    if settings.STORAGE_BACKEND == "supabase":
        assert db_evi.image_path.startswith("supabase://repair-evidence/")
    db.close()

    # 9. Authority approves repair
    review_res = client.patch(
        f"/tasks/{task_id}/review",
        json={"approved": True},
        headers={"Authorization": f"Bearer {authority_auth}"}
    )
    assert review_res.status_code == 200
    review_payload = review_res.json()
    assert review_payload["task"]["status"] == "RESOLVED"
    notif = review_payload.get("notificationPayload")
    assert notif is not None
    assert notif["event"] == "MUNICIPAL_REPAIR_RESOLVED"

    # 10. Citizen sees updated RESOLVED status and after-repair image URL
    citizen_final = client.get(
        f"/reports/{report_id}",
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert citizen_final.status_code == 200
    final_rep = citizen_final.json()
    assert final_rep["status"] == "RESOLVED"
    assert final_rep["restoredImageUrl"] is not None
    assert final_rep["restoredImageUrl"].startswith("http")

def test_04_rework_workflow(authority_auth, assigned_crew_auth):
    """PHASE 2.9: Rejection and rework workflow."""
    # Create and advance a fresh report
    c_res = client.post("/auth/signup", json={
        "name": "Rework Citizen",
        "email": f"rework_{int(time.time() * 1000)}@test.in",
        "password": "password123"
    })
    c_token = c_res.json()["token"]

    r_res = client.post(
        "/reports",
        files={"file": ("rework_pothole.png", io.BytesIO(DUMMY_PNG), "image/png")},
        data={"latitude": 30.72, "longitude": 76.81, "address": "Industrial Area Phase 1"},
        headers={"Authorization": f"Bearer {c_token}"}
    )
    rep_id = r_res.json()["id"]

    client.patch(f"/reports/{rep_id}/verify", json={"verified": True}, headers={"Authorization": f"Bearer {authority_auth}"})
    t_res = client.post(
        "/tasks",
        json={"report_id": rep_id, "assigned_team_id": "team-04", "priority": "MEDIUM"},
        headers={"Authorization": f"Bearer {authority_auth}"}
    )
    task_id = t_res.json()["id"]

    client.patch(f"/tasks/{task_id}/start", headers={"Authorization": f"Bearer {assigned_crew_auth}"})
    client.post(
        f"/tasks/{task_id}/completion",
        files={"file": ("rework_evi.png", io.BytesIO(DUMMY_PNG), "image/png")},
        data={"repair_notes": "Initial quick patch"},
        headers={"Authorization": f"Bearer {assigned_crew_auth}"}
    )

    # Authority requests rework
    rework_res = client.patch(
        f"/tasks/{task_id}/review",
        json={"approved": False, "rework_reason": "Uneven joint edge. Requires cold milling and flush re-pave."},
        headers={"Authorization": f"Bearer {authority_auth}"}
    )
    assert rework_res.status_code == 200
    assert rework_res.json()["task"]["status"] == "REWORK_REQUIRED"

    # Verify linked report also updated
    db = SessionLocal()
    db_rep = db.query(Report).filter(Report.id == rep_id).first()
    assert db_rep.status == "REWORK_REQUIRED"
    assert "Uneven joint edge" in db_rep.rework_notes
    db.close()

def test_05_security_and_environment_checks(authority_auth):
    """PHASE 3: Security, token tampering, and environment protections."""
    # 1. Missing Token
    assert client.get("/reports/my").status_code == 401

    # 2. Tampered / invalid Token
    assert client.get("/reports/my", headers={"Authorization": "Bearer invalid.fake.token"}).status_code == 401

    # 3. Citizen cannot access Authority approvals queue
    c_res = client.post("/auth/signup", json={
        "name": "Audit Citizen",
        "email": f"audit_{int(time.time() * 1000)}@test.in",
        "password": "password123"
    })
    c_token = c_res.json()["token"]
    assert client.get("/authority/approvals", headers={"Authorization": f"Bearer {c_token}"}).status_code == 403

    # 4. Storage private proxy requires authentication
    assert client.get("/storage/image/pothole-images/fake.png").status_code == 401

    # 5. Reset demo endpoint protected in non-development mode
    orig_env = settings.ENVIRONMENT
    try:
        settings.ENVIRONMENT = "production"
        reset_res = client.post("/reports/reset-demo")
        assert reset_res.status_code == 403
    finally:
        settings.ENVIRONMENT = orig_env

def test_06_database_and_storage_integrity():
    """PHASE 4: Verify all six PostgreSQL tables and relationships."""
    db = SessionLocal()
    try:
        # Check all 6 tables exist and are accessible
        user_count = db.query(User).count()
        report_count = db.query(Report).count()
        task_count = db.query(Task).count()
        evidence_count = db.query(RepairEvidence).count()
        history_count = db.query(StatusHistory).count()
        notif_count = db.query(NotificationEvent).count()

        assert user_count > 0, "Users table must not be empty"
        assert report_count >= 3, "Demo reports must exist"
        assert history_count > 0, "StatusHistory must have entries"

        # Verify foreign keys on a known report
        pf101 = db.query(Report).filter(Report.id == "PF-101").first()
        assert pf101 is not None
        assert pf101.reporter is not None
        assert pf101.status == "SUBMITTED"
    finally:
        db.close()
