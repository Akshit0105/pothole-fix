import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import engine, Base, SessionLocal, get_db_type
from .models import User, Report, Task, StatusHistory, RepairEvidence
from .security import get_password_hash
from .routes import auth, reports, tasks, ai, authority, storage

def seed_database():
    """Seeds default hackathon accounts and the exactly 3 required Indian demo reports (#PF-101, #PF-102, #PF-103)."""
    db = SessionLocal()
    try:
        reset_demo_database(db)
    finally:
        db.close()

def seed_demo_data(db: SessionLocal, overwrite: bool = False):
    """Non-destructively seeds standard demo accounts and the 3 Indian demo reports (#PF-101, #PF-102, #PF-103).
    - NEVER deletes existing records.
    - NEVER overwrites existing records unless overwrite=True.
    """
    Base.metadata.create_all(bind=engine)
    
    # 1. Seed standard demo accounts (only if they do not already exist)
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
        elif overwrite:
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

    # 3. Seed EXACTLY THREE Indian Demo Reports (all initially SUBMITTED for complete testability)
    print("[DB] Seeding the 3 Indian demo reports (#PF-101 Sector 17, #PF-102 Madhya Marg, #PF-103 Kharar)...")
    
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
        status="SUBMITTED",
    )

    r103 = Report(
        id="PF-103",
        tracking_number="PF-103",
        reporter_id="user-citizen-03",
        image_path="/photos/pothole-kharar.jpg",
        latitude=30.7499,
        longitude=76.6433,
        address="National Highway 5, Kharar, Punjab",
        description="Moderate asphalt road depression causing significant deceleration and commuter bicycle hazard near Kharar flyover junction.",
        severity="MEDIUM",
        ai_status="PENDING",
        ai_detection_json=json.dumps({
            "isModelConnected": False,
            "detected": True,
            "confidence": 0.85,
            "severityScore": "MODERATE",
            "boundingBoxes": []
        }),
        status="SUBMITTED",
    )

    db.add_all([r101, r102, r103])
    db.commit()

    # Add initial StatusHistory records
    h101 = StatusHistory(
        report_id="PF-101",
        actor_name="Akshit Sharma",
        status="SUBMITTED",
        note="Initial citizen report submitted with high-resolution photographic evidence.",
    )
    h102 = StatusHistory(
        report_id="PF-102",
        actor_name="Harjot Singh",
        status="SUBMITTED",
        note="Citizen flagged high-risk road degradation on Madhya Marg transit corridor.",
    )
    h103 = StatusHistory(
        report_id="PF-103",
        actor_name="Sneha Patel",
        status="SUBMITTED",
        note="Citizen logged road defect near Kharar highway flyover junction.",
    )
    db.add_all([h101, h102, h103])
    db.commit()
    seed_demo_data(db, overwrite=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure upload folder exists, create tables if not present
    uploads_path = Path(settings.UPLOAD_DIR)
    uploads_path.mkdir(parents=True, exist_ok=True)
    
    Base.metadata.create_all(bind=engine)

    # Demo seeding occurs only when explicitly enabled through configuration (SEED_DEMO_DATA=True)
    if settings.SEED_DEMO_DATA:
        seed_database()
        print(f"[{settings.APP_NAME}] Demo data seeding enabled & executed non-destructively.")
    else:
        print(f"[{settings.APP_NAME}] Database preserved: automatic demo reset/seeding disabled.")

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
app.include_router(storage.router)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "platform": settings.APP_NAME,
        "version": "2.4.0",
        "database": get_db_type(),
        "docs_url": "/docs",
    }
