from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import admin, events, students, donations, map_reservations
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

init_db()

app.include_router(admin.router, prefix="/api/auth", tags=["auth"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(students.router, prefix="/api/events/{event_id}/students", tags=["students"])
app.include_router(donations.router, prefix="/api/events/{event_id}/donations", tags=["donations"])
app.include_router(map_reservations.router, prefix="/api/events/{event_id}/map-reservations", tags=["map"])

@app.get("/")
def read_root():
    return {"msg": "ACS Can Drive API running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "msg": "ACS Can Drive API running"}

@app.options("/{path:path}")
def options_handler(path: str):
    return {"message": "OK"}

@app.get("/debug/admin")
def debug_admin():
    from database import get_db
    from models import Admin
    try:
        db = next(get_db())
        admin = db.query(Admin).filter(Admin.username == 'ACS_CanDrive').first()
        if admin:
            return {
                "admin_exists": True,
                "username": admin.username,
                "created_at": str(admin.created_at),
                "password_hash": admin.password_hash[:20] + "..."
            }
        else:
            return {"admin_exists": False}
    except Exception as e:
        return {"error": str(e)}

@app.get("/test-students")
def test_students(grade: str = None, homeroom: str = None, name: str = None, teacher: str = None):
    from database import get_db
    from models import Student
    try:
        db = next(get_db())
        students = db.query(Student).filter(Student.event_id == 1).all()
        return {
            "count": len(students),
            "params": {"grade": grade, "homeroom": homeroom, "name": name, "teacher": teacher},
            "students": [
                {
                    "id": s.id,
                    "name": f"{s.first_name} {s.last_name}".strip(),
                    "grade": s.grade,
                    "homeroom": s.homeroom_number,
                    "teacher": s.homeroom_teacher,
                    "total_cans": s.total_cans
                }
                for s in students[:5]  # First 5 students
            ]
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/debug/students")
def debug_students():
    from database import get_db
    from models import Student
    try:
        db = next(get_db())
        students = db.query(Student).filter(Student.event_id == 1).all()
        return {
            "count": len(students),
            "students": [
                {
                    "id": s.id,
                    "name": f"{s.first_name} {s.last_name}",
                    "grade": s.grade,
                    "homeroom": s.homeroom_number,
                    "teacher": s.homeroom_teacher
                }
                for s in students[:5]  # First 5 students
            ]
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/create-admin")
def create_admin():
    from database import get_db
    from models import Admin
    from datetime import datetime
    import hashlib
    try:
        db = next(get_db())
        
        # Check if admin already exists
        existing_admin = db.query(Admin).filter(Admin.username == 'ACS_CanDrive').first()
        if existing_admin:
            return {"message": "Admin user already exists", "username": existing_admin.username}
        
        # Create admin user
        admin = Admin(
            username='ACS_CanDrive',
            password_hash=hashlib.sha256('Assumption_raiders'.encode()).hexdigest(),
            created_at=datetime.now()
        )
        db.add(admin)
        db.commit()
        return {"message": "Admin user created successfully", "username": "ACS_CanDrive", "password": "Assumption_raiders"}
    except Exception as e:
        return {"error": str(e)}