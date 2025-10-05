from fastapi import FastAPI, UploadFile, File
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
# app.include_router(events.router, prefix="/api/events", tags=["events"])  # Temporarily disabled due to route conflict with direct leaderboard endpoint
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

@app.get("/debug/database")
def debug_database():
    from database import get_db
    from models import Student, Event
    try:
        print("DEBUG: Testing database connection...")
        db = next(get_db())
        
        # Test basic query
        student_count = db.query(Student).count()
        print(f"DEBUG: Student count: {student_count}")
        
        # Test event query
        events = db.query(Event).all()
        print(f"DEBUG: Event count: {len(events)}")
        
        # Test student query with limit
        students = db.query(Student).limit(5).all()
        print(f"DEBUG: First 5 students:")
        for s in students:
            print(f"  - {s.first_name} {s.last_name}, grade: {s.grade}, total_cans: {s.total_cans}")
        
        return {
            "student_count": student_count,
            "event_count": len(events),
            "sample_students": [
                {
                    "name": f"{s.first_name} {s.last_name}",
                    "grade": s.grade,
                    "total_cans": s.total_cans,
                    "event_id": s.event_id
                } for s in students
            ]
        }
    except Exception as e:
        print(f"DEBUG: Database error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.get("/debug/leaderboard")
def debug_leaderboard():
    from database import get_db
    from models import Student
    from collections import defaultdict
    try:
        print("DEBUG: Starting debug leaderboard...")
        db = next(get_db())
        students = db.query(Student).all()
        print(f"DEBUG: Found {len(students)} students")
        
        if len(students) == 0:
            return {"error": "No students found"}
        
        # Test with first 5 students
        test_students = students[:5]
        print(f"DEBUG: Testing with {len(test_students)} students")
        
        # Calculate totals
        total_cans = sum(int(s.total_cans or 0) for s in test_students)
        print(f"DEBUG: Total cans: {total_cans}")
        
        # Create simple leaderboard
        top_students = []
        for idx, s in enumerate(test_students):
            student_data = {
                "rank": idx + 1,
                "name": f"{s.first_name} {s.last_name}".strip(),
                "grade": s.grade,
                "homeroomNumber": s.homeroom_number,
                "totalCans": int(s.total_cans or 0),
            }
            top_students.append(student_data)
            print(f"DEBUG: Student {idx+1}: {student_data}")
        
        return {
            "topStudents": top_students,
            "totalCans": total_cans,
            "debug": f"Processed {len(test_students)} students"
        }
        
    except Exception as e:
        print(f"DEBUG: Error in debug leaderboard: {str(e)}")
        import traceback
        traceback.print_exc()
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
def get_leaderboard():
    """Get leaderboard data for event 1"""
    from database import get_db
    from models import Student
    from collections import defaultdict
    
    try:
        # Get database connection
        db = next(get_db())
        
        # Get all students for event 1
        students = db.query(Student).filter(Student.event_id == 1).all()
        
        if not students:
            return {
                "topStudents": [],
                "topClasses": [],
                "topGrades": [],
                "totalCans": 0
            }
        
        # Calculate total cans
        total_cans = sum(student.total_cans or 0 for student in students)
        
        # Top Students - sort by total_cans descending
        students_sorted = sorted(students, key=lambda s: s.total_cans or 0, reverse=True)
        top_students = []
        for i, student in enumerate(students_sorted[:50]):
            top_students.append({
                "rank": i + 1,
                "name": f"{student.first_name} {student.last_name}".strip(),
                "grade": student.grade,
                "homeroomNumber": student.homeroom_number,
                "totalCans": student.total_cans or 0
            })
        
        # Top Classes - group by teacher and homeroom
        class_groups = defaultdict(int)
        for student in students:
            key = f"{student.homeroom_teacher or ''} {student.homeroom_number or ''}".strip()
            class_groups[key] += student.total_cans or 0
        
        classes_sorted = sorted(class_groups.items(), key=lambda x: x[1], reverse=True)
        top_classes = []
        for i, (class_name, cans) in enumerate(classes_sorted[:50]):
            # Split class name back into teacher and room
            parts = class_name.split(' ', 1)
            teacher = parts[0] if parts else ""
            room = parts[1] if len(parts) > 1 else ""
            
            top_classes.append({
                "rank": i + 1,
                "name": class_name,
                "homeroomNumber": room,
                "totalCans": cans
            })
        
        # Top Grades - group by grade
        grade_groups = defaultdict(int)
        for student in students:
            grade = str(student.grade or '').strip()
            grade_groups[grade] += student.total_cans or 0
        
        grades_sorted = sorted(grade_groups.items(), key=lambda x: x[1], reverse=True)
        top_grades = []
        for i, (grade, cans) in enumerate(grades_sorted[:50]):
            top_grades.append({
                "rank": i + 1,
                "grade": grade,
                "totalCans": cans
            })
        
        return {
            "topStudents": top_students,
            "topClasses": top_classes,
            "topGrades": top_grades,
            "totalCans": total_cans
        }
        
    except Exception as e:
        print(f"Leaderboard error: {e}")
        return {
            "topStudents": [],
            "topClasses": [],
            "topGrades": [],
            "totalCans": 0,
            "error": str(e)
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

@app.post("/api/events/1/upload-roster")
async def upload_roster_direct(file: UploadFile = File(...)):
    from database import get_db
    from models import Student
    import openpyxl
    from io import BytesIO
    try:
        db = next(get_db())
        content = await file.read()
        wb = openpyxl.load_workbook(BytesIO(content), data_only=True)
        sheet = wb.active
        added = 0
        header_indexes = None
        for i, row in enumerate(sheet.iter_rows(values_only=True)):
            # Determine header mapping on first row
            if i == 0:
                headers = [str(c).strip().lower() if c is not None else '' for c in row]
                def find_any(keys):
                    return next((idx for idx, h in enumerate(headers) if any(k in h for k in keys)), None)
                header_indexes = {
                    'full_name': find_any(['name', 'student', 'full']),
                    'grade': find_any(['grade']),
                    'homeroom_number': (lambda x: x if x is not None else find_any(['room']))(find_any(['homeroom'])),
                    'homeroom_teacher': find_any(['teacher']),
                }
                # If headers not matched, fall back to first four columns
                if header_indexes['full_name'] is None and len(row) >= 4:
                    header_indexes = { 'full_name': 0, 'grade': 1, 'homeroom_number': 2, 'homeroom_teacher': 3 }
                continue

            def val(index):
                return (str(row[index]).strip() if (index is not None and index < len(row) and row[index] is not None) else None)

            full_name = val(header_indexes['full_name'])
            grade = val(header_indexes['grade'])
            homeroom_number = val(header_indexes['homeroom_number'])
            homeroom_teacher = val(header_indexes['homeroom_teacher'])

            # Parse full name into first and last name
            if not full_name:
                continue
            
            first_name = ''
            last_name = ''
            
            # handle formats: "Last, First" or "First Last"
            if ',' in full_name:
                parts = [p.strip() for p in full_name.split(',', 1)]
                if len(parts) == 2:
                    last_name, first_name = parts[0], parts[1]
            else:
                parts = [p.strip() for p in full_name.split(' ') if p.strip()]
                if len(parts) >= 2:
                    first_name = parts[0]
                    last_name = ' '.join(parts[1:])
                elif len(parts) == 1:
                    first_name = parts[0]
                    last_name = ''
            
            if not first_name:
                continue
            existing = (
                db.query(Student)
                .filter(
                    Student.event_id == 1,
                    Student.first_name == str(first_name).strip(),
                    Student.last_name == str(last_name).strip(),
                )
                .first()
            )
            if existing:
                continue
            student = Student(
                first_name=str(first_name).strip(),
                last_name=str(last_name).strip(),
                grade=str(grade).strip() if grade is not None else None,
                homeroom_number=str(homeroom_number).strip() if homeroom_number is not None else None,
                homeroom_teacher=str(homeroom_teacher).strip() if homeroom_teacher is not None else None,
                event_id=1,
            )
            db.add(student)
            added += 1
        db.commit()
        return {"added": added}
    except Exception as e:
        return {"error": str(e)}