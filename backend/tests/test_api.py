import io
import time
import pytest
from fastapi.testclient import TestClient
from app.main import app, seed_database
from app.database import Base, engine, SessionLocal
from app.models import Report, Task, User, NotificationEvent

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"

def test_full_lifecycle_and_security():
    # 1. Citizen Signup & Login
    unique_email = f"test.citizen_{int(time.time() * 1000)}@example.com"
    signup_res = client.post("/auth/signup", json={
        "name": "Test Citizen User",
        "email": unique_email,
        "password": "strongPassword123",
        "role": "AUTHORITY" # Attack: public signup trying to claim AUTHORITY
    })
    assert signup_res.status_code == 201
    citizen_auth = signup_res.json()
    assert citizen_auth["user"]["role"] == "CITIZEN" # Enforces CITIZEN role!
    citizen_token = citizen_auth["token"]

    login_res = client.post("/auth/login", json={
        "email": unique_email,
        "password": "strongPassword123"
    })
    assert login_res.status_code == 200
    assert login_res.json()["token"]

    # Authority and Crew Login using Seed Accounts
    auth_login = client.post("/auth/login", json={
        "email": "s.chen@publicworks.gov",
        "password": "password123"
    })
    assert auth_login.status_code == 200
    authority_token = auth_login.json()["token"]

    crew_login = client.post("/auth/login", json={
        "email": "m.vance@asphalt-unit04.city",
        "password": "password123"
    })
    assert crew_login.status_code == 200
    crew_token = crew_login.json()["token"]

    # 2 & 15. Invalid image upload rejected
    invalid_file = io.BytesIO(b"fake text file")
    bad_upload = client.post(
        "/reports",
        files={"file": ("malicious.exe", invalid_file, "application/octet-stream")},
        data={"latitude": 43.65, "longitude": -79.38, "address": "Test St"},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert bad_upload.status_code == 400

    # 2. Citizen uploads valid pothole report with image
    valid_png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00"
        b"\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4"
        b"\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    img_file = io.BytesIO(valid_png)
    report_res = client.post(
        "/reports",
        files={"file": ("pothole.png", img_file, "image/png")},
        data={
            "latitude": 30.7333,
            "longitude": 76.7794,
            "address": "Sector 22 Market Road, Chandigarh",
            "description": "Critical road defect near transit stop."
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert report_res.status_code == 201
    created_report = report_res.json()
    report_id = created_report["id"]
    assert created_report["status"] == "SUBMITTED"

    # 3. Report persists in SQLite
    db = SessionLocal()
    db_report = db.query(Report).filter(Report.id == report_id).first()
    assert db_report is not None
    db.close()

    # 4. Authority sees the submitted report
    triage_res = client.get(
        "/reports",
        headers={"Authorization": f"Bearer {authority_token}"}
    )
    assert triage_res.status_code == 200
    report_ids = [r["id"] for r in triage_res.json()]
    assert report_id in report_ids

    # 13. Unauthorized Role check: Citizen cannot verify report
    unauth_verify = client.patch(
        f"/reports/{report_id}/verify",
        json={"verified": True},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert unauth_verify.status_code == 403

    # 5. Authority verifies the report
    verify_res = client.patch(
        f"/reports/{report_id}/verify",
        json={"verified": True, "reason": "Class A hazard verified"},
        headers={"Authorization": f"Bearer {authority_token}"}
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "VERIFIED"

    # 6. Authority assigns a repair team
    task_res = client.post(
        "/tasks",
        json={
            "report_id": report_id,
            "assigned_team_id": "team-04",
            "assigned_team_name": "Asphalt Unit 04",
            "priority": "HIGH",
            "deadline": "Today 18:00 EST",
            "instructions": "Saw-cut and hot-mix flush compaction."
        },
        headers={"Authorization": f"Bearer {authority_token}"}
    )
    assert task_res.status_code == 201
    created_task = task_res.json()
    task_id = created_task["id"]
    assert created_task["status"] == "PENDING"

    # 7. Assigned repair team sees its work order
    team_tasks_res = client.get(
        "/tasks/my",
        headers={"Authorization": f"Bearer {crew_token}"}
    )
    assert team_tasks_res.status_code == 200
    task_ids = [t["id"] for t in team_tasks_res.json()]
    assert task_id in task_ids

    # 8. Repair team starts work
    start_res = client.patch(
        f"/tasks/{task_id}/start",
        headers={"Authorization": f"Bearer {crew_token}"}
    )
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "IN_PROGRESS"

    # 9. Repair team uploads completion evidence
    evidence_img = io.BytesIO(valid_png)
    evidence_res = client.post(
        f"/tasks/{task_id}/completion",
        files={"file": ("evidence.png", evidence_img, "image/png")},
        data={"repair_notes": "100% flush asphalt compaction completed."},
        headers={"Authorization": f"Bearer {crew_token}"}
    )
    assert evidence_res.status_code == 200
    assert evidence_res.json()["status"] == "AWAITING_APPROVAL"

    # Authority Approvals queue lists the task
    approvals_res = client.get(
        "/authority/approvals",
        headers={"Authorization": f"Bearer {authority_token}"}
    )
    assert approvals_res.status_code == 200
    approval_ids = [a["id"] for a in approvals_res.json()]
    assert task_id in approval_ids

    # 10. Authority approves the repair
    approve_res = client.patch(
        f"/tasks/{task_id}/review",
        json={"approved": True},
        headers={"Authorization": f"Bearer {authority_token}"}
    )
    assert approve_res.status_code == 200
    review_data = approve_res.json()
    assert review_data["task"]["status"] == "RESOLVED"
    notif_data = review_data.get("notificationPayload") or review_data.get("notification_payload")
    assert notif_data is not None
    assert notif_data["event"] == "MUNICIPAL_REPAIR_RESOLVED"

    # 11. Citizen sees RESOLVED status and approved evidence
    citizen_view = client.get(
        f"/reports/{report_id}",
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert citizen_view.status_code == 200
    final_report = citizen_view.json()
    assert final_report["status"] == "RESOLVED"
    restored_img = final_report.get("restoredImageUrl") or final_report.get("restored_image_url")
    assert restored_img is not None

    # 14. Rework handling check on a fresh report
    r2_res = client.post(
        "/reports",
        json={
            "location": {"latitude": 43.65, "longitude": -79.39, "address": "Queen St"},
            "description": "Pothole for rework test"
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    r2_id = r2_res.json()["id"]
    client.patch(f"/reports/{r2_id}/verify", json={"verified": True}, headers={"Authorization": f"Bearer {authority_token}"})
    t2_res = client.post(
        "/tasks",
        json={"report_id": r2_id, "assigned_team_id": "team-04", "priority": "MEDIUM"},
        headers={"Authorization": f"Bearer {authority_token}"}
    )
    t2_id = t2_res.json()["id"]
    client.patch(f"/tasks/{t2_id}/start", headers={"Authorization": f"Bearer {crew_token}"})
    client.post(f"/tasks/{t2_id}/completion", json={"repair_notes": "First attempt"}, headers={"Authorization": f"Bearer {crew_token}"})

    rework_res = client.patch(
        f"/tasks/{t2_id}/review",
        json={"approved": False, "rework_reason": "Rough grade. Needs re-compaction."},
        headers={"Authorization": f"Bearer {authority_token}"}
    )
    assert rework_res.status_code == 200
    assert rework_res.json()["task"]["status"] == "REWORK_REQUIRED"

def test_data_persistence_across_restart():
    # 12. Verify data survives engine disposal / reconnection
    engine.dispose()
    new_db = SessionLocal()
    reports_count = new_db.query(Report).count()
    assert reports_count >= 3
    r101 = new_db.query(Report).filter(Report.id == "PF-101").first()
    assert r101 is not None
    assert r101.severity == "CRITICAL"
    assert r101.status == "SUBMITTED"
    new_db.close()

def test_ai_detect_placeholder():
    valid_png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00"
        b"\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4"
        b"\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    img_file = io.BytesIO(valid_png)
    res = client.post("/ai/detect", files={"file": ("road.png", img_file, "image/png")})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "AI_UNAVAILABLE"
    assert data["detected"] is False
    assert len(data["boxes"]) == 0
