import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, Base, engine
from app.models import User, Task, Report
from app.schemas import UserLogin, CreateTaskRequest
from app.routes import auth, tasks
from app.security import verify_password
from fastapi import HTTPException

def run_tests():
    print("==================================================")
    print("STARTING BACKEND REPAIR CREW AUTHORIZATION TESTS")
    print("==================================================")
    db = SessionLocal()
    try:
        # 1. Verify all three crews exist in database
        crews = [
            ("team-04", "Punjab PWD Unit 04", "gurpreet@pwd.punjab.gov.in", "Gurpreet Singh"),
            ("team-02", "Chandigarh MC Road Squad 02", "amit@mc.chandigarh.gov.in", "Amit Verma"),
            ("team-01", "Delhi Emergency Arterial Unit 01", "rajesh@pwd.delhi.gov.in", "Rajesh Sharma"),
        ]

        print("\n[1/5] Verifying 3 Repair Crew Accounts in Database...")
        crew_users = {}
        for team_id, unit, email, name in crews:
            user = db.query(User).filter(User.email == email).first()
            assert user is not None, f"User {email} not found!"
            assert user.role == "REPAIR_TEAM", f"User {email} has role {user.role}, expected REPAIR_TEAM"
            assert user.team_id == team_id, f"User {email} has team_id {user.team_id}, expected {team_id}"
            assert verify_password("password123", user.password_hash), f"Password check failed for {email}"
            crew_users[team_id] = user
            print(f"  [PASS] Found Crew: {user.name} | Unit: {user.unit} | Team: {user.team_id} | Email: {user.email}")

        # 2. Test independent authentication for all three crews
        print("\n[2/5] Testing Independent Crew Authentication (/auth/login)...")
        tokens = {}
        for team_id, unit, email, name in crews:
            login_req = UserLogin(email=email, password="password123")
            auth_res = auth.login(login_req, db)
            assert auth_res.token, f"Token missing for {email}"
            assert auth_res.user.role == "REPAIR_TEAM"
            assert auth_res.user.team_id == team_id
            tokens[team_id] = auth_res.token
            print(f"  [PASS] Authenticated: {auth_res.user.name} -> Token issued (teamId={auth_res.user.team_id})")

        # 3. Test Authority Task Assignment to All 3 Crews
        print("\n[3/5] Testing Municipal Authority Task Assignment to All 3 Crews...")
        authority_user = db.query(User).filter(User.role == "AUTHORITY").first()
        assert authority_user is not None, "Authority user not found"

        created_tasks = {}
        test_reports = []
        for i, (team_id, unit, email, name) in enumerate(crews):
            # Create a distinct verified report for each crew assignment
            rpt_id = f"TEST-RPT-{team_id}"
            existing = db.query(Report).filter(Report.id == rpt_id).first()
            if existing:
                db.delete(existing)
                db.commit()

            rpt = Report(
                id=rpt_id,
                tracking_number=rpt_id,
                reporter_id="user-citizen-01",
                image_path="/photos/pothole-sector17.jpg",
                latitude=30.7398 + (i * 0.01),
                longitude=76.7827 + (i * 0.01),
                address=f"Corridor Zone {team_id}, Testing Area",
                description=f"Road surface defect in corridor {team_id}",
                status="VERIFIED",
            )
            db.add(rpt)
            db.commit()
            test_reports.append(rpt)

            task_req = CreateTaskRequest(
                report_id=rpt.id,
                assigned_team_id=team_id,
                assigned_team_name=f"{unit} (Lead: {name})",
                priority="HIGH",
                deadline="Today 18:00 IST",
                instructions="Saw-cut perimeter and compaction.",
            )
            created_task = tasks.create_task(task_req, request=None, current_user=authority_user, db=db)
            created_tasks[team_id] = created_task
            print(f"  [PASS] Dispatched Task #{created_task.id} to {created_task.assigned_team_name}")

        # 4. Test Crew-Specific Task Isolation (/tasks/my)
        print("\n[4/5] Testing Crew-Specific Task Isolation (/tasks/my)...")
        for team_id, unit, email, name in crews:
            crew_user = crew_users[team_id]
            my_tasks = tasks.get_my_tasks(request=None, current_user=crew_user, db=db)
            for t in my_tasks:
                assert t.assigned_team_id == team_id, f"Cross-contamination: Crew {team_id} received task for {t.assigned_team_id}"
            task_ids = [t.id for t in my_tasks]
            assert created_tasks[team_id].id in task_ids, f"Task {created_tasks[team_id].id} not in Crew {team_id}'s queue"
            print(f"  [PASS] Crew {team_id} ({name}) sees {len(my_tasks)} tasks -- all strictly assigned to {team_id}!")

        # 5. Test Cross-Crew Authorization Enforcement (403 Forbidden)
        print("\n[5/5] Testing Cross-Crew RBAC Enforcement (Crew A cannot access Crew B's tasks)...")
        task_for_crew_04 = created_tasks["team-04"]
        crew_02_user = crew_users["team-02"]

        # Crew 02 tries to view Crew 04's task
        forbidden_triggered = False
        try:
            tasks.get_task_detail(task_for_crew_04.id, request=None, current_user=crew_02_user, db=db)
        except HTTPException as e:
            if e.status_code == 403:
                forbidden_triggered = True
                print(f"  [PASS] Blocked with HTTP 403 Forbidden: {e.detail}")

        assert forbidden_triggered, "Security breach: Crew 02 was able to view Crew 04's task!"

        # Crew 02 tries to start Crew 04's task
        start_blocked = False
        try:
            tasks.start_task(task_for_crew_04.id, request=None, current_user=crew_02_user, db=db)
        except HTTPException as e:
            if e.status_code == 403:
                start_blocked = True
                print(f"  [PASS] Start blocked with HTTP 403 Forbidden: {e.detail}")

        assert start_blocked, "Security breach: Crew 02 was able to start Crew 04's task!"

        # Clean up test tasks and test reports
        for team_id, t in created_tasks.items():
            db_task = db.query(Task).filter(Task.id == t.id).first()
            if db_task:
                db.delete(db_task)
        for rpt in test_reports:
            db_rpt = db.query(Report).filter(Report.id == rpt.id).first()
            if db_rpt:
                db.delete(db_rpt)
        db.commit()

        print("\n==================================================")
        print("SUCCESS: ALL BACKEND REPAIR CREW AUTH TESTS PASSED!")
        print("==================================================")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
