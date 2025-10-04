from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from database import get_db
from models import MapReservation, Student
from schemas import MapReservationCreate
import csv
from io import StringIO

router = APIRouter()

@router.get("/")
def list_reservations(event_id: int, db: Session = Depends(get_db)):
    reservations = db.query(MapReservation).filter(MapReservation.event_id == event_id).all()
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

@router.post("/")
def reserve_street(event_id: int, payload: MapReservationCreate, db: Session = Depends(get_db)):
    existing = db.query(MapReservation).filter(
        MapReservation.event_id == event_id,
        MapReservation.street_name.ilike(payload.street_name)
    ).first()
    if existing:
        return {"error": "Street already reserved"}
    reservation = MapReservation(**payload.dict(), event_id=event_id)
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation 

@router.get("/export.csv")
def export_reservations(event_id: int, db: Session = Depends(get_db)):
    rows = db.query(MapReservation).filter(MapReservation.event_id == event_id).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student Name", "Street Name", "Timestamp"]) 
    for r in rows:
        writer.writerow([r.name or (r.student.first_name + ' ' + r.student.last_name if r.student else ''), r.street_name, r.timestamp.isoformat()])
    contents = output.getvalue()
    return Response(contents, media_type='text/csv', headers={'Content-Disposition': 'attachment; filename="reservations.csv"'})