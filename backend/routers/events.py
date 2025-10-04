from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import Event, Student, Donation, MapReservation
from schemas import EventCreate
import openpyxl
from io import BytesIO
from collections import defaultdict
from fastapi import HTTPException

router = APIRouter()

@router.post("/")
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    db_event = Event(name=event.name, start_date=event.start_date, end_date=event.end_date)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/")
def list_events(db: Session = Depends(get_db)):
    return db.query(Event).all()

@router.post("/{event_id}/upload-roster")
async def upload_roster(event_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
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
                Student.event_id == event_id,
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
            event_id=event_id,
        )
        db.add(student)
        added += 1
    db.commit()
    return {"added": added}

@router.get("/{event_id}/leaderboard")
def leaderboard(event_id: int, db: Session = Depends(get_db)):
    # If event missing, return empty leaderboard rather than 404
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return {"topStudents": [], "topClasses": [], "topGrades": [], "totalCans": 0}

    students = db.query(Student).filter(Student.event_id == event_id).all()

    # Total cans overall
    total_cans = sum(int(s.total_cans or 0) for s in students)

    # Top students
    sorted_students = sorted(students, key=lambda s: int(s.total_cans or 0), reverse=True)
    top_students = [
        {
            "rank": idx + 1,
            "name": f"{s.first_name} {s.last_name}".strip(),
            "grade": int(s.grade) if (s.grade and str(s.grade).isdigit()) else s.grade,
            "homeroomNumber": s.homeroom_number,
            "totalCans": int(s.total_cans or 0),
        }
        for idx, s in enumerate(sorted_students[:50])
    ]

    # Top classes: group by homeroom teacher + number
    class_totals = defaultdict(int)
    for s in students:
        key = (s.homeroom_teacher or "", s.homeroom_number or "")
        class_totals[key] += int(s.total_cans or 0)
    sorted_classes = sorted(class_totals.items(), key=lambda kv: kv[1], reverse=True)
    top_classes = [
        {
            "rank": idx + 1,
            "name": f"{teacher} {room}".strip(),
            "homeroomNumber": room,
            "totalCans": total,
        }
        for idx, ((teacher, room), total) in enumerate(sorted_classes[:50])
    ]

    # Top grades
    grade_totals = defaultdict(int)
    for s in students:
        grade_totals[str(s.grade or '').strip()] += int(s.total_cans or 0)
    sorted_grades = sorted(grade_totals.items(), key=lambda kv: kv[1], reverse=True)
    top_grades = [
        {
            "rank": idx + 1,
            "grade": (int(g) if g.isdigit() else g),
            "totalCans": total,
        }
        for idx, (g, total) in enumerate(sorted_grades[:50])
    ]

    return {
        "topStudents": top_students,
        "topClasses": top_classes,
        "topGrades": top_grades,
        "totalCans": total_cans,
    }

@router.delete("/{event_id}/reset")
def reset_event(event_id: int, db: Session = Depends(get_db)):
    # wipe reservations, donations, and students for this event
    db.query(MapReservation).filter(MapReservation.event_id == event_id).delete()
    db.query(Donation).filter(Donation.event_id == event_id).delete()
    db.query(Student).filter(Student.event_id == event_id).delete()
    db.commit()
    return {"status": "ok"}