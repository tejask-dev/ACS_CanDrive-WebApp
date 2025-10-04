from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, declarative_base
import datetime

Base = declarative_base()

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    students = relationship("Student", back_populates="event")
    donations = relationship("Donation", back_populates="event")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    grade = Column(String)
    homeroom_number = Column(String)
    homeroom_teacher = Column(String)
    event_id = Column(Integer, ForeignKey("events.id"))
    total_cans = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    event = relationship("Event", back_populates="students")
    reservations = relationship("MapReservation", back_populates="student")

class Donation(Base):
    __tablename__ = "donations"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    admin_id = Column(Integer, ForeignKey("admins.id"))
    amount = Column(Integer)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    event = relationship("Event", back_populates="donations")

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    password_hash = Column(String)
    email = Column(String, nullable=True)
    role = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

class Award(Base):
    __tablename__ = "awards"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    title = Column(String)
    description = Column(Text)
    criteria = Column(String)
    quantity = Column(Integer)
    created_by = Column(Integer, ForeignKey("admins.id"))

class MapReservation(Base):
    __tablename__ = "map_reservations"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    name = Column(String)  # for public/students
    street_name = Column(String)
    geojson = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    event_id = Column(Integer, ForeignKey("events.id"))
    student = relationship("Student", back_populates="reservations")