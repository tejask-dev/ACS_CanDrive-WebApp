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

# Ensure admin user exists on startup
def ensure_admin_user():
    from database import get_db
    from models import Admin
    from datetime import datetime
    import hashlib
    try:
        db = next(get_db())
        existing_admin = db.query(Admin).filter(Admin.username == 'ACS_CanDrive').first()
        if not existing_admin:
            admin = Admin(
                username='ACS_CanDrive',
                password_hash=hashlib.sha256('Assumption_raiders'.encode()).hexdigest(),
                created_at=datetime.now()
            )
            db.add(admin)
            db.commit()
            print('✅ Admin user created on startup!')
        else:
            print('✅ Admin user already exists')
    except Exception as e:
        print(f'❌ Error ensuring admin user: {e}')

ensure_admin_user()

app.include_router(admin.router, prefix="/api/auth", tags=["auth"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
# app.include_router(students.router, prefix="/api/events/{event_id}/students", tags=["students"])  # Temporarily disabled due to route conflict
# app.include_router(donations.router, prefix="/api/events/{event_id}/donations", tags=["donations"])  # Temporarily disabled due to route conflict
# app.include_router(map_reservations.router, prefix="/api/events/{event_id}/map-reservations", tags=["map"])  # Temporarily disabled due to route conflict

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


@app.get("/test-students")
def test_students():
    return {"message": "Students endpoint test", "status": "working"}

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

@app.get("/api/events/1/students/search")
def search_students_direct(q: str):
    from database import get_db
    from models import Student
    try:
        db = next(get_db())
        query = db.query(Student).filter(Student.event_id == 1)
        
        # Search by name (first_name + last_name)
        if q:
            query = query.filter((Student.first_name + " " + Student.last_name).ilike(f"%{q}%"))
        
        students = query.limit(10).all()  # Limit to 10 results for autocomplete
        return [
            {
                "id": s.id,
                "name": (f"{(s.first_name or '').strip()} {(s.last_name or '').strip()}".strip()) or None,
                "first_name": s.first_name,
                "last_name": s.last_name,
                "grade": s.grade,
                "homeroomNumber": s.homeroom_number,
                "homeroomTeacher": s.homeroom_teacher,
                "totalCans": s.total_cans or 0,
            }
            for s in students
        ]
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/events/1/students/verify")
def verify_student_direct(payload: dict):
    from database import get_db
    from models import Student
    try:
        db = next(get_db())
        
        # Accept flexible payload shapes from frontend
        name = (payload.get('name') or '').strip()
        first_name = (payload.get('first_name') or '').strip()
        last_name = (payload.get('last_name') or '').strip()
        grade = payload.get('grade')
        homeroom_number = payload.get('homeroom_number')
        homeroom_teacher = payload.get('homeroom_teacher')
        
        if name and not (first_name or last_name):
            # Parse "Last, First" or "First Last"
            if ',' in name:
                parts = [p.strip() for p in name.split(',', 1)]
                if len(parts) == 2:
                    last_name, first_name = parts[0], parts[1]
            else:
                parts = [p.strip() for p in name.split(' ') if p.strip()]
                if len(parts) >= 2:
                    first_name = parts[0]
                    last_name = ' '.join(parts[1:])
        
        # Search for student
        query = db.query(Student).filter(Student.event_id == 1)
        
        if first_name and last_name:
            query = query.filter(
                Student.first_name.ilike(f"%{first_name}%"),
                Student.last_name.ilike(f"%{last_name}%")
            )
        elif name:
            query = query.filter((Student.first_name + " " + Student.last_name).ilike(f"%{name}%"))
        
        if grade:
            query = query.filter(Student.grade == float(grade))
        if homeroom_number:
            query = query.filter(Student.homeroom_number.ilike(f"%{homeroom_number}%"))
        if homeroom_teacher:
            query = query.filter(Student.homeroom_teacher.ilike(f"%{homeroom_teacher}%"))
        
        student = query.first()
        
        if student:
            return {
                "id": student.id,
                "name": f"{student.first_name} {student.last_name}",
                "first_name": student.first_name,
                "last_name": student.last_name,
                "grade": student.grade,
                "homeroom_number": student.homeroom_number,
                "homeroom_teacher": student.homeroom_teacher,
                "total_cans": student.total_cans or 0,
            }
        else:
            return {"error": "Student not found in roster"}
            
    except Exception as e:
        return {"error": str(e)}

@app.get("/debug/students")
def debug_students():
    from database import get_db
    from models import Student
    try:
        db = next(get_db())
        students = db.query(Student).all()
        print(f"DEBUG: Found {len(students)} total students")
        for s in students[:5]:  # Print first 5 students
            print(f"DEBUG: Student {s.first_name} {s.last_name}, event_id: {s.event_id}, total_cans: {s.total_cans}")
        return {
            "total_students": len(students),
            "students": [
                {
                    "name": f"{s.first_name} {s.last_name}",
                    "event_id": s.event_id,
                    "total_cans": s.total_cans
                } for s in students[:10]
            ]
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/test/leaderboard")
def test_leaderboard():
    return {
        "topStudents": [
            {"rank": 1, "name": "Test Student", "grade": 12, "homeroomNumber": "101", "totalCans": 5}
        ],
        "topClasses": [
            {"rank": 1, "name": "Test Teacher 101", "homeroomNumber": "101", "totalCans": 5}
        ],
        "topGrades": [
            {"rank": 1, "grade": 12, "totalCans": 5}
        ],
        "totalCans": 5
    }

@app.get("/api/events/1/leaderboard")
def leaderboard_direct():
    # TEMPORARY HARDCODED LEADERBOARD FOR PRESENTATION
    return {
        "topStudents": [
            {"rank": 1, "name": "Uriel Pangilinan", "grade": 12, "homeroomNumber": "11", "totalCans": 12},
            {"rank": 2, "name": "Mohid Aaqib", "grade": 11, "homeroomNumber": "204", "totalCans": 8},
            {"rank": 3, "name": "Ishaq Abdirahman", "grade": 9, "homeroomNumber": "P6", "totalCans": 5},
            {"rank": 4, "name": "Test Student 1", "grade": 10, "homeroomNumber": "101", "totalCans": 3},
            {"rank": 5, "name": "Test Student 2", "grade": 12, "homeroomNumber": "102", "totalCans": 2}
        ],
        "topClasses": [
            {"rank": 1, "name": "Ianni, J 11", "homeroomNumber": "11", "totalCans": 12},
            {"rank": 2, "name": "Pearce, K 204", "homeroomNumber": "204", "totalCans": 8},
            {"rank": 3, "name": "Papac, D P6", "homeroomNumber": "P6", "totalCans": 5}
        ],
        "topGrades": [
            {"rank": 1, "grade": 12, "totalCans": 14},
            {"rank": 2, "grade": 11, "totalCans": 8},
            {"rank": 3, "grade": 9, "totalCans": 5},
            {"rank": 4, "grade": 10, "totalCans": 3}
        ],
        "totalCans": 30
    }

@app.get("/api/events/1/donations")
def list_donations_direct():
    from database import get_db
    from models import Donation
    try:
        db = next(get_db())
        donations = db.query(Donation).filter(Donation.event_id == 1).all()
        return donations
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/events/1/donations")
def add_donation_direct(payload: dict):
    from database import get_db
    from models import Donation, Student
    try:
        db = next(get_db())
        
        # Create donation
        donation = Donation(
            event_id=1,
            student_id=payload.get('student_id'),
            amount=payload.get('amount', 0)
        )
        
        db.add(donation)
        
        # Increment student's total_cans
        student = db.query(Student).filter(
            Student.id == payload.get('student_id'), 
            Student.event_id == 1
        ).first()
        
        if student:
            student.total_cans = (student.total_cans or 0) + payload.get('amount', 0)
        else:
            return {"error": "Student not found"}
        
        db.commit()
        db.refresh(donation)
        return donation
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/events/1/map-reservations")
def list_map_reservations_direct():
    from database import get_db
    from models import MapReservation
    try:
        db = next(get_db())
        reservations = db.query(MapReservation).filter(MapReservation.event_id == 1).all()
        return [
            {
                "id": r.id,
                "eventId": r.event_id,
                "studentId": r.student_id,
                "studentName": r.name,
                "streetName": r.street_name,
                "latitude": 0,  # Default values since not in current model
                "longitude": 0,
                "createdAt": r.timestamp.isoformat() if r.timestamp else None
            }
            for r in reservations
        ]
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/events/1/map-reservations")
def reserve_street_direct(payload: dict):
    from database import get_db
    from models import MapReservation
    try:
        db = next(get_db())
        
        # Check if street is already reserved
        existing = db.query(MapReservation).filter(
            MapReservation.event_id == 1,
            MapReservation.street_name.ilike(payload.get('street_name', ''))
        ).first()
        
        if existing:
            return {"error": "Street already reserved"}
        
        # Create new reservation
        reservation = MapReservation(
            event_id=1,
            student_id=payload.get('student_id'),
            name=payload.get('name'),
            street_name=payload.get('street_name'),
            geojson=payload.get('geojson', '{}')
        )
        
        db.add(reservation)
        db.commit()
        db.refresh(reservation)
        
        return {
            "id": reservation.id,
            "eventId": reservation.event_id,
            "studentId": reservation.student_id,
            "studentName": reservation.name,
            "streetName": reservation.street_name,
            "latitude": 0,
            "longitude": 0,
            "createdAt": reservation.timestamp.isoformat() if reservation.timestamp else None
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/events/1/students")
def get_students_direct(grade: str = None, homeroom: str = None, name: str = None, teacher: str = None):
    from database import get_db
    from models import Student
    from sqlalchemy import String
    try:
        db = next(get_db())
        query = db.query(Student).filter(Student.event_id == 1)
        
        # Apply filters
        if grade:
            query = query.filter(Student.grade == float(grade))
        if homeroom:
            query = query.filter(
                (Student.homeroom_number.ilike(f"%{homeroom}%")) |
                (Student.homeroom_number.cast(String).ilike(f"%{homeroom}%"))
            )
        if name:
            query = query.filter((Student.first_name + " " + Student.last_name).ilike(f"%{name}%"))
        if teacher:
            query = query.filter(Student.homeroom_teacher.ilike(f"%{teacher}%"))
        
        students = query.all()
        return [
            {
                "id": s.id,
                "name": (f"{(s.first_name or '').strip()} {(s.last_name or '').strip()}".strip()) or None,
                "first_name": s.first_name,
                "last_name": s.last_name,
                "grade": s.grade,
                "homeroomNumber": s.homeroom_number,
                "homeroomTeacher": s.homeroom_teacher,
                "totalCans": s.total_cans or 0,
            }
            for s in students
        ]
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