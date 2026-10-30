import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import Report, User, StatusHistory
from app.security import create_access_token, get_password_hash

# ---------------------------------------------------------
# Isolated in-memory SQLite database fixture
# Guarantees zero disruption to the application database (potholefix.db)
# ---------------------------------------------------------
TEST_DB_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(autouse=True)
def isolated_db_fixture():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db

    db = TestingSessionLocal()
    try:
        # Seed test users
        citizen = User(
            id="test-citizen-id",
            name="Rohan Mehra",
            email="rohan@example.com",
            password_hash=get_password_hash("password123"),
            role="CITIZEN",
            avatar_initials="RM",
        )
        authority = User(
            id="test-authority-id",
            name="Alice Sharma",
            email="alice@potholefix.gov.in",
            password_hash=get_password_hash("password123"),
            role="AUTHORITY",
            avatar_initials="AS",
        )
        crew = User(
            id="test-crew-id",
            name="Gurpreet Singh",
            email="gurpreet@pwd.punjab.gov.in",
            password_hash=get_password_hash("password123"),
            role="REPAIR_TEAM",
            team_id="team-04",
            unit="Punjab PWD Unit 04",
            avatar_initials="GS",
        )
        db.add_all([citizen, authority, crew])

        # Seed test report with initial LOW severity and AI metadata
        initial_ai_metadata = {
            "detected": True,
            "confidence": 0.88,
            "severityScore": "LOW",
            "boundingBoxes": [
                {"x": 12.5, "y": 24.0, "width": 45.0, "height": 30.0, "label": "pothole", "confidence": 0.88}
            ],
            "isModelConnected": True,
            "detectedAt": "2026-10-30T10:00:00Z"
        }

        test_report = Report(
            id="PF-TEST-101",
            tracking_number="PF-TEST-101",
            reporter_id="test-citizen-id",
            image_path="/photos/test-defect.jpg",
            latitude=30.7398,
            longitude=76.7827,
            address="Sector 17 Inner Corridor, Chandigarh",
            description="Active road hazard near plaza parking gate.",
            severity="LOW",
            ai_status="PENDING",
            ai_detection_json=json.dumps(initial_ai_metadata),
            status="SUBMITTED",
        )
        db.add(test_report)

        # Initial submission audit history
        initial_history = StatusHistory(
            report_id=test_report.id,
            actor_id="test-citizen-id",
            actor_name="Rohan Mehra",
            status="SUBMITTED",
            note="Report created by citizen.",
        )
        db.add(initial_history)
        db.commit()
    finally:
        db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


def get_token(user_id: str) -> str:
    return create_access_token({"sub": user_id})


# ---------------------------------------------------------
# Test Cases (1 to 12)
# ---------------------------------------------------------

def test_1_authority_successfully_changes_severity():
    """1. Authority successfully changes severity from LOW to CRITICAL."""
    auth_token = get_token("test-authority-id")
    res = client.patch(
        "/reports/PF-TEST-101/severity",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"severity": "CRITICAL", "note": "High arterial bus transit corridor"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["aiDetection"]["severityScore"] == "CRITICAL"
    assert data["status"] == "SUBMITTED"


def test_2_invalid_severity_is_rejected():
    """2. Invalid severity values are rejected with 400 Bad Request."""
    auth_token = get_token("test-authority-id")
    res = client.patch(
        "/reports/PF-TEST-101/severity",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"severity": "EXTREME_CATASTROPHIC", "note": "Invalid tier"}
    )
    assert res.status_code == 400
    assert "Invalid severity level" in res.json()["detail"]


def test_3_citizen_receives_403():
    """3. Citizen user role attempting override receives 403 Forbidden."""
    citizen_token = get_token("test-citizen-id")
    res = client.patch(
        "/reports/PF-TEST-101/severity",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={"severity": "CRITICAL"}
    )
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]


def test_4_repair_team_receives_403():
    """4. Repair crew lead role attempting override receives 403 Forbidden."""
    crew_token = get_token("test-crew-id")
    res = client.patch(
        "/reports/PF-TEST-101/severity",
        headers={"Authorization": f"Bearer {crew_token}"},
        json={"severity": "CRITICAL"}
    )
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]


def test_5_missing_authentication_receives_401():
    """5. Missing or invalid authentication token receives 401 Unauthorized."""
    res = client.patch(
        "/reports/PF-TEST-101/severity",
        json={"severity": "CRITICAL"}
    )
    assert res.status_code == 401


def test_6_missing_report_returns_404():
    """6. Non-existent report ID returns 404 Not Found."""
    auth_token = get_token("test-authority-id")
    res = client.patch(
        "/reports/PF-NONEXISTENT-999/severity",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"severity": "CRITICAL"}
    )
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_7_report_status_remains_unchanged():
    """7. Verifies that report workflow status remains unchanged after severity override."""
    auth_token = get_token("test-authority-id")
    res = client.patch(
        "/reports/PF-TEST-101/severity",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"severity": "HIGH", "note": "Adjusted risk tier"}
    )
    assert res.status_code == 200

    db = TestingSessionLocal()
    try:
        report = db.query(Report).filter(Report.id == "PF-TEST-101").first()
        assert report.status == "SUBMITTED", "Report status must not change during severity override!"
    finally:
        db.close()


def test_8_database_update_persists():
    """8. Verifies direct database persistence of the new severity in the reports table."""
    auth_token = get_token("test-authority-id")
    res = client.patch(
        "/reports/PF-TEST-101/severity",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"severity": "HIGH"}
    )
    assert res.status_code == 200

    db = TestingSessionLocal()
    try:
        report = db.query(Report).filter(Report.id == "PF-TEST-101").first()
        assert report.severity == "HIGH"
    finally:
        db.close()


def test_9_audit_history_is_created_correctly():
    """9. Verifies that StatusHistory logs actor name, unchanged status, previous and new severity."""
    auth_token = get_token("test-authority-id")
    res = client.patch(
        "/reports/PF-TEST-101/severity",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"severity": "CRITICAL", "note": "Visual confirmation of structural cratering."}
    )
    assert res.status_code == 200

    db = TestingSessionLocal()
    try:
        entries = db.query(StatusHistory).filter(StatusHistory.report_id == "PF-TEST-101").all()
        # Initial submission entry + new severity override entry = 2 entries
        assert len(entries) == 2
        latest = entries[-1]
        assert latest.actor_name == "Alice Sharma"
        assert latest.actor_id == "test-authority-id"
        assert latest.status == "SUBMITTED"
        assert "LOW to CRITICAL" in latest.note
        assert "Visual confirmation of structural cratering." in latest.note
    finally:
        db.close()


def test_10_repeated_overrides_create_separate_audit_entries():
    """10. Repeated severity overrides create separate immutable audit entries."""
    auth_token = get_token("test-authority-id")

    # First override: LOW -> HIGH
    res1 = client.patch(
        "/reports/PF-TEST-101/severity",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"severity": "HIGH", "note": "Preliminary triage"}
    )
    assert res1.status_code == 200

    # Second override: HIGH -> CRITICAL
    res2 = client.patch(
        "/reports/PF-TEST-101/severity",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"severity": "CRITICAL", "note": "Second inspection with traffic impact"}
    )
    assert res2.status_code == 200

    db = TestingSessionLocal()
    try:
        entries = db.query(StatusHistory).filter(StatusHistory.report_id == "PF-TEST-101").all()
        # Initial (1) + Override 1 (1) + Override 2 (1) = 3 entries
        assert len(entries) == 3
        assert "LOW to HIGH" in entries[1].note
        assert "HIGH to CRITICAL" in entries[2].note
    finally:
        db.close()


def test_11_existing_ai_bounding_boxes_and_confidence_metadata_remain_unchanged():
    """11. Verifies that original AI bounding boxes, confidence score, and model flags are preserved."""
    auth_token = get_token("test-authority-id")
    res = client.patch(
        "/reports/PF-TEST-101/severity",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"severity": "CRITICAL"}
    )
    assert res.status_code == 200

    db = TestingSessionLocal()
    try:
        report = db.query(Report).filter(Report.id == "PF-TEST-101").first()
        ai_data = json.loads(report.ai_detection_json)
        assert ai_data["severityScore"] == "CRITICAL"
        assert ai_data["severityOverridden"] is True
        # Original metadata preserved
        assert ai_data["confidence"] == 0.88
        assert ai_data["isModelConnected"] is True
        assert len(ai_data["boundingBoxes"]) == 1
        assert ai_data["boundingBoxes"][0]["label"] == "pothole"
        assert ai_data["boundingBoxes"][0]["x"] == 12.5
    finally:
        db.close()


def test_12_transaction_rollback_works_when_operation_fails(monkeypatch):
    """12. Verifies complete transaction rollback if an unexpected error occurs during update."""
    auth_token = get_token("test-authority-id")

    # Simulate an error during db.commit()
    from sqlalchemy.orm import Session
    orig_commit = Session.commit

    def failing_commit(self):
        raise RuntimeError("Simulated transient database connection rupture")

    monkeypatch.setattr(Session, "commit", failing_commit)

    res = client.patch(
        "/reports/PF-TEST-101/severity",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"severity": "CRITICAL", "note": "Will fail"}
    )
    assert res.status_code == 500
    assert "Failed to update report severity" in res.json()["detail"]

    # Restore commit and verify database was rolled back
    monkeypatch.undo()

    db = TestingSessionLocal()
    try:
        report = db.query(Report).filter(Report.id == "PF-TEST-101").first()
        assert report.severity == "LOW", "Database should be rolled back to original severity!"
        entries = db.query(StatusHistory).filter(StatusHistory.report_id == "PF-TEST-101").all()
        assert len(entries) == 1, "Failed transaction must not insert audit history!"
    finally:
        db.close()
