import re

path = r"C:\Users\DELL\.gemini\antigravity\scratch\potholefix\backend\app\main.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_seed = """    # 3. Seed EXACTLY THREE Indian Demo Reports (all initially SUBMITTED for complete testability)
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
    db.commit()"""

new_seed = """    # 3. Seed Canonical Reports Across the 4 Main Sections (Section A, B, C and Resolved Archive PF-999)
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
        submitted_by="Gurpreet Singh (Crew Lead)",
    )
    e999 = RepairEvidence(
        task_id="WO-PF-999",
        image_path="/photos/pothole-restored1.jpg",
        notes="Saw-cut square excavation and hot-mix compaction completed with Level-1 municipal pass certified.",
        submitted_by="Gurpreet Singh (Crew Lead)",
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
    db.commit()"""

assert old_seed in content, "old_seed not found"
content = content.replace(old_seed, new_seed, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS PATCHING backend main.py")
