from pydantic import BaseModel
from typing import Optional
import datetime

class EventBase(BaseModel):
    name: str

class EventCreate(EventBase):
    start_date: Optional[datetime.datetime]
    end_date: Optional[datetime.datetime]

class Event(EventBase):
    id: int
    created_at: datetime.datetime
    class Config:
        orm_mode = True

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    grade: str
    homeroom_number: Optional[str]
    homeroom_teacher: Optional[str]

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    total_cans: int
    created_at: datetime.datetime
    class Config:
        orm_mode = True

class AdminBase(BaseModel):
    username: str
    email: Optional[str]
    role: Optional[str]

class AdminCreate(AdminBase):
    password: str

class Admin(AdminBase):
    id: int
    created_at: datetime.datetime
    last_login: Optional[datetime.datetime]
    class Config:
        orm_mode = True

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminChangePassword(BaseModel):
    username: str
    old_password: str
    new_password: str

class DonationCreate(BaseModel):
    student_id: int
    admin_id: int
    amount: int
    note: Optional[str] = None

class Donation(DonationCreate):
    id: int
    timestamp: datetime.datetime
    class Config:
        orm_mode = True

class MapReservationCreate(BaseModel):
    student_id: Optional[int] = None
    name: str
    street_name: str
    geojson: Optional[str] = None

class MapReservation(MapReservationCreate):
    id: int
    timestamp: datetime.datetime
    event_id: int
    class Config:
        orm_mode = True