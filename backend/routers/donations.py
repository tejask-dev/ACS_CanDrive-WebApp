from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Donation, Student
from schemas import DonationCreate

router = APIRouter()

@router.get("/")
def list_donations(event_id: int, db: Session = Depends(get_db)):
    return db.query(Donation).filter(Donation.event_id == event_id).all()

@router.post("/")
def add_donation(event_id: int, payload: DonationCreate, db: Session = Depends(get_db)):
    donation = Donation(**payload.dict(), event_id=event_id)
    db.add(donation)
    # increment student's total_cans
    student = db.query(Student).filter(Student.id == payload.student_id, Student.event_id == event_id).first()
    if student:
        student.total_cans = (student.total_cans or 0) + payload.amount
    db.commit()
    db.refresh(donation)
    return donation