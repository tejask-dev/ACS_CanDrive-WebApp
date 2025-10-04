from fastapi import APIRouter, Depends, HTTPException
from typing import Any, Dict
from sqlalchemy.orm import Session
from database import get_db
from models import Student
from schemas import StudentCreate

router = APIRouter()

@router.get("/")
def list_students(event_id: int, grade: str = None, homeroom: str = None, name: str = None, teacher: str = None, db: Session = Depends(get_db)):
    query = db.query(Student).filter(Student.event_id == event_id)
    
    if grade:
        query = query.filter(Student.grade == grade)
    if homeroom:
        query = query.filter(Student.homeroom_number.ilike(f"%{homeroom}%"))
    if name:
        query = query.filter((Student.first_name + " " + Student.last_name).ilike(f"%{name}%"))
    if teacher:
        query = query.filter(Student.homeroom_teacher.ilike(f"%{teacher}%"))
    
    rows = query.all()
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
        for s in rows
    ]

@router.get("/search")
def search_students(event_id: int, q: str, db: Session = Depends(get_db)):
    print(f"🔍 Search Debug - event_id: {event_id}, query: '{q}'")
    q_like = f"%{q}%"
    
    # First, let's see all students for this event
    all_students = db.query(Student).filter(Student.event_id == event_id).all()
    print(f"🔍 Search Debug - Total students in event {event_id}: {len(all_students)}")
    
    # Show first few student names for debugging
    for i, s in enumerate(all_students[:5]):
        full_name = f"{s.first_name} {s.last_name}"
        print(f"🔍 Search Debug - Student {i+1}: '{full_name}'")
    
    rows = (
        db.query(Student)
        .filter(
            Student.event_id == event_id,
            (Student.first_name + " " + Student.last_name).ilike(q_like),
        )
        .all()
    )
    print(f"🔍 Search Debug - Found {len(rows)} matching students")
    
    return [
        {
            "id": s.id,
            "name": f"{s.first_name} {s.last_name}",
            "grade": s.grade,
            "homeroomNumber": s.homeroom_number,
            "homeroomTeacher": s.homeroom_teacher,
            "totalCans": s.total_cans,
        }
        for s in rows
    ]

@router.post("/")
def add_student(event_id: int, payload: StudentCreate, db: Session = Depends(get_db)):
    student = Student(**payload.dict(), event_id=event_id)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.post("/verify")
def verify_student(event_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    # Accept flexible payload shapes from frontend
    name = (payload.get('name') or '').strip()
    first_name = (payload.get('first_name') or '').strip()
    last_name = (payload.get('last_name') or '').strip()
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
            elif len(parts) == 1:
                first_name = parts[0]

    fn = first_name
    ln = last_name

    # Build base query
    query = db.query(Student).filter(Student.event_id == event_id)

    # Try exact (case-insensitive) match with optional class filters
    candidates = (
        query
        .filter(
            (Student.first_name.ilike(fn)) & (Student.last_name.ilike(ln))
        )
        .all()
    )

    # If not found, try swapped order (handles "Last, First" input)
    if not candidates and fn and ln:
        candidates = (
            query
            .filter(
                (Student.first_name.ilike(ln)) & (Student.last_name.ilike(fn))
            )
            .all()
        )

    # Filter by grade/homeroom/teacher if provided
    def matches_filters(s: Student) -> bool:
        ok = True
        grade = payload.get('grade')
        homeroom_number = payload.get('homeroom_number') or payload.get('homeroomNumber')
        homeroom_teacher = payload.get('homeroom_teacher') or payload.get('homeroomTeacher')
        if grade not in (None, ''):
            ok = ok and str(s.grade or "").strip() == str(grade).strip()
        if homeroom_number:
            ok = ok and (s.homeroom_number or "").strip().lower() == str(homeroom_number).strip().lower()
        if homeroom_teacher:
            ok = ok and (s.homeroom_teacher or "").strip().lower() == str(homeroom_teacher).strip().lower()
        return ok

    candidates = [s for s in candidates if matches_filters(s)] or candidates

    existing = candidates[0] if candidates else None
    if not existing:
        raise HTTPException(status_code=404, detail="Student not found in roster")
    return {"id": existing.id, "name": f"{existing.first_name} {existing.last_name}".strip(),
            "grade": existing.grade, "homeroomNumber": existing.homeroom_number,
            "homeroomTeacher": existing.homeroom_teacher}

@router.put("/{student_id}")
def update_student(event_id: int, student_id: int, payload: StudentCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id, Student.event_id == event_id).first()
    for key, value in payload.dict().items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student

@router.delete("/{student_id}")
def delete_student(event_id: int, student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id, Student.event_id == event_id).first()
    db.delete(student)
    db.commit()
    return {"msg": "Deleted"}