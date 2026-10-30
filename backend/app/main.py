import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import engine, Base, SessionLocal
from .models import User, Report, Task, StatusHistory, RepairEvidence
from .security import get_password_hash
from .routes import auth, reports, tasks, ai, authority

def ensure_seed_users(db: SessionLocal):
    """Safely provisions and synchronizes all official role accounts without affecting existing reports."""
    Base.metadata.create_all(bind=engine)
    seed_users = [
        ("user-citizen-01", "Akshit Sharma", "akshit@potholefix.in", "password123", "CITIZEN", None, None, "Civic Reporter", "Community Volunteer", "AS"),
        ("user-citizen-alias", "Akshit Sharma", "alex.rivera@community.org", "password123", "CITIZEN", None, None, "Civic Reporter", "Community Volunteer", "AS"),
        ("user-citizen-02", "Harjot Singh", "harjot@potholefix.in", "password123", "CITIZEN", None, None, "Civic Reporter", "Resident Association Lead", "HS"),
        ("user-citizen-03", "Sneha Patel", "sneha@potholefix.in", "password123", "CITIZEN", None, None, "Civic Reporter", "Daily Highway Commuter", "SP"),
        ("user-auth-01", "Alice Sharma", "alice@potholefix.gov.in", "password123", "AUTHORITY", None, None, "Municipal Commissioner", "Dept of Municipal Public Works", "AS"),
        ("user-auth-alias", "Alice Sharma", "s.chen@publicworks.gov", "password123", "AUTHORITY", None, None, "Municipal Commissioner", "Dept of Municipal Public Works", "AS"),
        ("user-team-01", "Gurpreet Singh", "gurpreet@pwd.punjab.gov.in", "password123", "REPAIR_TEAM", "team-04", "Punjab PWD Unit 04", "Repair Crew Lead", "Punjab Public Works Department", "GS"),
        ("user-team-alias", "Gurpreet Singh", "m.vance@asphalt-unit04.city", "password123", "REPAIR_TEAM", "team-04", "Punjab PWD Unit 04", "Repair Crew Lead", "Punjab Public Works Department", "GS"),
        ("user-team-02", "Amit Verma", "amit@mc.chandigarh.gov.in", "password123", "REPAIR_TEAM", "team-02", "Chandigarh MC Road Squad 02", "Repair Crew Lead", "Municipal Corporation Chandigarh", "AV"),
        ("user-team-02-alias", "Amit Verma", "amit@potholefix.in", "password123", "REPAIR_TEAM", "team-02", "Chandigarh MC Road Squad 02", "Repair Crew Lead", "Municipal Corporation Chandigarh", "AV"),
        ("user-team-03", "Rajesh Sharma", "rajesh@pwd.delhi.gov.in", "password123", "REPAIR_TEAM", "team-01", "Delhi Emergency Arterial Unit 01", "Repair Crew Lead", "Delhi Public Works Department", "RS"),
        ("user-team-03-alias", "Rajesh Sharma", "rajesh@potholefix.in", "password123", "REPAIR_TEAM", "team-01", "Delhi Emergency Arterial Unit 01", "Repair Crew Lead", "Delhi Public Works Department", "RS"),
    ]
    for uid, name, email, pwd, role, team_id, unit, title, dept, initials in seed_users:
        clean_email = email.lower().strip()
        u = db.query(User).filter(User.email == clean_email).first()
        if not u:
            final_uid = uid
            if db.query(User).filter(User.id == uid).first():
                import hashlib
                final_uid = f"{uid}-{hashlib.md5(clean_email.encode()).hexdigest()[:6]}"
            u = User(
                id=final_uid,
                name=name,
                email=clean_email,
                password_hash=get_password_hash(pwd),
                role=role,
                team_id=team_id,
                unit=unit,
                title=title,
                department=dept,
                avatar_initials=initials,
            )
            db.add(u)
        else:
            u.name = name
            if not u.password_hash:
                u.password_hash = get_password_hash(pwd)
            u.role = role
            u.avatar_initials = initials
            if team_id:
                u.team_id = team_id
            if unit:
                u.unit = unit
            if title:
                u.title = title
            if dept:
                u.department = dept
    db.commit()

def seed_database():
    """Ensures all required accounts exist; seeds canonical demo reports only if the database is unpopulated."""
    db = SessionLocal()
    try:
        ensure_seed_users(db)
        if db.query(Report).count() == 0:
            reset_demo_database(db)
    finally:
        db.close()

def reset_demo_database(db: SessionLocal):
    """Resets demo data to the pristine 3-report initial state while preserving any real users."""
    Base.metadata.create_all(bind=engine)
    # 1. Seed / Update standard demo accounts with Indian identities
    seed_users = [
        ("user-citizen-01", "Akshit Sharma", "akshit@potholefix.in", "password123", "CITIZEN", None, None, "Civic Reporter", "Community Volunteer", "AS"),
        ("user-citizen-alias", "Akshit Sharma", "alex.rivera@community.org", "password123", "CITIZEN", None, None, "Civic Reporter", "Community Volunteer", "AS"),
        ("user-citizen-02", "Harjot Singh", "harjot@potholefix.in", "password123", "CITIZEN", None, None, "Civic Reporter", "Resident Association Lead", "HS"),
        ("user-citizen-03", "Sneha Patel", "sneha@potholefix.in", "password123", "CITIZEN", None, None, "Civic Reporter", "Daily Highway Commuter", "SP"),
        ("user-auth-01", "Alice Sharma", "alice@potholefix.gov.in", "password123", "AUTHORITY", None, None, "Municipal Commissioner", "Dept of Municipal Public Works", "AS"),
        ("user-auth-alias", "Alice Sharma", "s.chen@publicworks.gov", "password123", "AUTHORITY", None, None, "Municipal Commissioner", "Dept of Municipal Public Works", "AS"),
        ("user-team-01", "Gurpreet Singh", "gurpreet@pwd.punjab.gov.in", "password123", "REPAIR_TEAM", "team-04", "Punjab PWD Unit 04", "Repair Crew Lead", "Punjab Public Works Department", "GS"),
        ("user-team-alias", "Gurpreet Singh", "m.vance@asphalt-unit04.city", "password123", "REPAIR_TEAM", "team-04", "Punjab PWD Unit 04", "Repair Crew Lead", "Punjab Public Works Department", "GS"),
        ("user-team-02", "Amit Verma", "amit@mc.chandigarh.gov.in", "password123", "REPAIR_TEAM", "team-02", "Chandigarh MC Road Squad 02", "Repair Crew Lead", "Municipal Corporation Chandigarh", "AV"),
        ("user-team-02-alias", "Amit Verma", "amit@potholefix.in", "password123", "REPAIR_TEAM", "team-02", "Chandigarh MC Road Squad 02", "Repair Crew Lead", "Municipal Corporation Chandigarh", "AV"),
        ("user-team-03", "Rajesh Sharma", "rajesh@pwd.delhi.gov.in", "password123", "REPAIR_TEAM", "team-01", "Delhi Emergency Arterial Unit 01", "Repair Crew Lead", "Delhi Public Works Department", "RS"),
        ("user-team-03-alias", "Rajesh Sharma", "rajesh@potholefix.in", "password123", "REPAIR_TEAM", "team-01", "Delhi Emergency Arterial Unit 01", "Repair Crew Lead", "Delhi Public Works Department", "RS"),
    ]
    for uid, name, email, pwd, role, team_id, unit, title, dept, initials in seed_users:
        clean_email = email.lower().strip()
        u = db.query(User).filter(User.email == clean_email).first()
        if not u:
            # If default uid is already assigned to another email, append deterministic suffix
            final_uid = uid
            if db.query(User).filter(User.id == uid).first():
                import hashlib
                final_uid = f"{uid}-{hashlib.md5(clean_email.encode()).hexdigest()[:6]}"
            u = User(
                id=final_uid,
                name=name,
                email=clean_email,
                password_hash=get_password_hash(pwd),
                role=role,
                team_id=team_id,
                unit=unit,
                title=title,
                department=dept,
                avatar_initials=initials,
            )
            db.add(u)
        else:
            u.name = name
            if not u.password_hash:
                u.password_hash = get_password_hash(pwd)
            u.role = role
            u.avatar_initials = initials
            if unit:
                u.unit = unit
            if title:
                u.title = title
            if dept:
                u.department = dept
    db.commit()

    # 2. Reset database state completely to the pristine 3-report demo baseline
    db.query(RepairEvidence).delete(synchronize_session=False)
    db.query(StatusHistory).delete(synchronize_session=False)
    db.query(Task).delete(synchronize_session=False)
    db.query(Report).delete(synchronize_session=False)
    db.commit()
    db.commit()

    # 3. Seed Canonical Reports Across the 4 Main Sections (Section A, B, C and Resolved Archive PF-999)
    print("[DB] Seeding canonical reports (#PF-101 Incoming, #PF-102 In Progress, #PF-103 Awaiting Approval, #PF-999 Resolved & Closed)...")
    
    r101 = Report(
        id="PF-101",
        tracking_number="PF-101",
        reporter_id="user-citizen-01",
        image_path="/photos/pothole-sector17.jpg",
        latitude=30.7398,
        longitude=76.7827,
        address="Sector 17 Plaza Corridor, Chandigarh",
        description="Deep structural asphalt crater with fractured jagged borders on Sector 17 commercial transit corridor, causing severe vehicle swerving.",
        severity="CRITICAL",
        ai_status="PENDING",
        ai_detection_json=json.dumps({
            "isModelConnected": False,
            "detected": True,
            "confidence": 0.94,
            "severityScore": "CRITICAL",
            "boundingBoxes": []
        }),
        status="SUBMITTED",
    )

    r102 = Report(
        id="PF-102",
        tracking_number="PF-102",
        reporter_id="user-citizen-02",
        image_path="/photos/pothole-madhyamarg.jpg",
        latitude=30.7290,
        longitude=76.8040,
        address="Madhya Marg Arterial, Sector 26, Chandigarh",
        description="Significant asphalt fatigue cracking and depression across main carriageway near grain market intersection.",
        severity="HIGH",
        ai_status="PENDING",
        ai_detection_json=json.dumps({
            "isModelConnected": False,
            "detected": True,
            "confidence": 0.91,
            "severityScore": "HIGH",
            "boundingBoxes": []
        }),
        status="IN_PROGRESS",
    )

    r103 = Report(
        id="PF-103",
        tracking_number="PF-103",
        reporter_id="user-citizen-03",
        image_path="/photos/pothole-kharar.jpg",
        restored_image_path="/photos/pothole-restored2.jpg",
        latitude=30.7499,
        longitude=76.6433,
        address="National Highway 5, Kharar, Punjab",
        description="Moderate asphalt road depression near Kharar flyover junction. Field repair completed; photo submitted.",
        severity="MEDIUM",
        ai_status="PENDING",
        ai_detection_json=json.dumps({
            "isModelConnected": False,
            "detected": True,
            "confidence": 0.85,
            "severityScore": "MODERATE",
            "boundingBoxes": []
        }),
        status="AWAITING_APPROVAL",
    )

    r999 = Report(
        id="PF-999",
        tracking_number="PF-999",
        reporter_id="user-citizen-01",
        image_path="/photos/pothole-sector17.jpg",
        restored_image_path="/photos/pothole-restored1.jpg",
        latitude=30.7414,
        longitude=76.7921,
        address="Sector 17 Plaza Corridor, Chandigarh",
        description="Deep asphalt defect restored flush to grade with saw-cut square perimeter and hot-mix compaction. Level-1 certified pass.",
        severity="CRITICAL",
        ai_status="CONFIRMED",
        ai_detection_json=json.dumps({
            "isModelConnected": True,
            "detected": True,
            "confidence": 0.94,
            "severityScore": "CRITICAL",
            "boundingBoxes": []
        }),
        status="RESOLVED",
        rework_notes="Level-1 inspection pass certified by Alice Sharma (Municipal Commissioner). Compaction flush with pavement.",
    )

    db.add_all([r101, r102, r103, r999])
    db.commit()

    # Seed Associated Tasks for Sections B, C, and D
    t102 = Task(
        id="WO-PF-102",
        work_order_number="WO-PF-102",
        report_id="PF-102",
        assigned_team_id="team-04",
        assigned_team_name="Punjab PWD Unit 04",
        priority="HIGH",
        status="IN_PROGRESS",
        instructions="Saw-cut perimeter, remove debris, apply tack coat, and compact hot-mix asphalt.",
        deadline="Today 18:00 IST",
    )
    t103 = Task(
        id="WO-PF-103",
        work_order_number="WO-PF-103",
        report_id="PF-103",
        assigned_team_id="team-04",
        assigned_team_name="Punjab PWD Unit 04",
        priority="MEDIUM",
        status="AWAITING_APPROVAL",
        instructions="Cold saw-cut perimeter and roller compaction.",
        deadline="Standard 24h SLA",
    )
    t999 = Task(
        id="WO-PF-999",
        work_order_number="WO-PF-999",
        report_id="PF-999",
        assigned_team_id="team-04",
        assigned_team_name="Punjab PWD Unit 04",
        priority="CRITICAL",
        status="RESOLVED",
        instructions="Emergency high-traffic corridor restoration. Saw-cut and level flush compaction.",
        deadline="Immediate 6h SLA",
    )
    db.add_all([t102, t103, t999])
    db.commit()

    # Seed Evidence for PF-999 and PF-103
    e103 = RepairEvidence(
        task_id="WO-PF-103",
        image_path="/photos/pothole-restored2.jpg",
        notes="Post-compaction photograph submitted by Gurpreet Singh for Level-1 municipal inspection.",
        uploaded_by_id="user-team-01",
    )
    e999 = RepairEvidence(
        task_id="WO-PF-999",
        image_path="/photos/pothole-restored1.jpg",
        notes="Saw-cut square excavation and hot-mix compaction completed with Level-1 municipal pass certified.",
        uploaded_by_id="user-team-01",
    )
    db.add_all([e103, e999])
    db.commit()

    # Seed StatusHistory records
    h101 = StatusHistory(
        report_id="PF-101",
        actor_name="Akshit Sharma",
        status="SUBMITTED",
        note="Initial citizen report submitted with high-resolution photographic evidence.",
    )
    h102 = StatusHistory(
        report_id="PF-102",
        actor_name="Alice Sharma",
        status="ASSIGNED",
        note="Work order dispatched to Punjab PWD Unit 04 (Lead: Gurpreet Singh).",
    )
    h103 = StatusHistory(
        report_id="PF-103",
        actor_name="Gurpreet Singh",
        status="AWAITING_APPROVAL",
        note="Post-repair photographic evidence uploaded for Level-1 municipal review.",
    )
    h999_1 = StatusHistory(
        report_id="PF-999",
        actor_name="Akshit Sharma",
        status="SUBMITTED",
        note="Hazard reported by citizen with GPS coordinates.",
    )
    h999_2 = StatusHistory(
        report_id="PF-999",
        actor_name="Alice Sharma",
        status="VERIFIED",
        note="Defect confirmed by Authority Inspector.",
    )
    h999_3 = StatusHistory(
        report_id="PF-999",
        actor_name="Gurpreet Singh",
        status="IN_PROGRESS",
        note="Crew arrived on site. Saw-cutting and compaction started.",
    )
    h999_4 = StatusHistory(
        report_id="PF-999",
        actor_name="Alice Sharma",
        status="RESOLVED",
        note="Level-1 inspection pass certified. Completed road patch approved.",
    )
    db.add_all([h101, h102, h103, h999_1, h999_2, h999_3, h999_4])
    db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure upload folder exists, create tables, seed database
    uploads_path = Path(settings.UPLOAD_DIR)
    uploads_path.mkdir(parents=True, exist_ok=True)
    
    Base.metadata.create_all(bind=engine)
    seed_database()
    print(f"[{settings.APP_NAME}] Backend initialized successfully.")
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    description="FastAPI Backend for PotholeFix AI Pothole Detection & Repair Management Platform",
    version="2.4.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads and realistic demo photos
uploads_dir = Path(settings.UPLOAD_DIR).resolve()
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

photos_dir = Path(__file__).resolve().parent.parent.parent / "public" / "photos"
if photos_dir.exists():
    app.mount("/photos", StaticFiles(directory=str(photos_dir)), name="photos")

# Include Routers
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(tasks.router)
app.include_router(ai.router)
app.include_router(authority.router)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "platform": settings.APP_NAME,
        "version": "2.4.0",
        "database": "sqlite",
        "docs_url": "/docs",
    }
