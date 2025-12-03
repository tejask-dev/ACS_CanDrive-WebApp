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
        from_attributes = True

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
        from_attributes = True

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
        from_attributes = True

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
        from_attributes = True

class MapReservationCreate(BaseModel):
    """
    Schema for creating a new map reservation.
    
    The geojson field stores path coordinates for map highlighting.
    Format: [{ lat, lng, name, path: [{lat, lng}, ...] }]
    """
    student_id: Optional[int] = None
    name: str
    street_name: str
    group_members: Optional[str] = None  # Comma-separated names of group collection partners
    geojson: Optional[str] = None  # Path coordinates for map highlighting

class MapReservation(MapReservationCreate):
    id: int
    timestamp: datetime.datetime
    event_id: int
    class Config:
        from_attributes = True