"""
Database Models for ACS Can Drive
==================================

This module defines the SQLAlchemy ORM models for the can drive application.
These models represent the database tables and their relationships.

Entity Relationship Diagram:
----------------------------
Event (1) ----< (N) Student
Event (1) ----< (N) Teacher  
Event (1) ----< (N) Donation
Event (1) ----< (N) MapReservation
Student (1) ----< (N) Donation
Student (1) ----< (N) MapReservation
Teacher (1) ----< (N) Donation
Admin (1) ----< (N) Donation (recorder)

Key Design Decisions:
- Events are the top-level container for yearly can drives
- Students and Teachers are separate entities to track donations differently
- Donations link to either a Student OR a Teacher (never both)
- MapReservations store geojson data for street path highlighting
- Total cans are stored on Student/Teacher for fast leaderboard queries

Author: ACS Can Drive Development Team
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, declarative_base
import datetime

# SQLAlchemy declarative base for all models
Base = declarative_base()


class Event(Base):
    """
    Event Model - Represents a can drive event (typically one per year).
    
    This is the top-level container that groups all data for a specific
    can drive campaign. Changing CURRENT_EVENT_ID in config.py allows
    the system to run new events in future years.
    
    Attributes:
        id: Primary key, referenced by CURRENT_EVENT_ID in config
        name: Display name (e.g., "ACS Can Drive 2025")
        start_date: When the can drive begins
        end_date: When the can drive ends (optional)
        created_at: Record creation timestamp
    """
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    students = relationship("Student", back_populates="event")
    donations = relationship("Donation", back_populates="event")


class Student(Base):
    """
    Student Model - Represents a student participating in the can drive.
    
    Students are imported from Excel roster files. Each student belongs to
    a specific event and can make donations and reserve streets.
    
    Key Fields:
        total_cans: Running total of cans donated - updated on each donation.
                   This is the primary field used for leaderboard rankings.
        homeroom_number: Used for class groupings (normalized to 3 digits)
        homeroom_teacher: Links student to their teacher for class rankings
    """
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    grade = Column(String)  # Stored as string to handle various formats
    homeroom_number = Column(String)  # Normalized to 3 digits (e.g., "018")
    homeroom_teacher = Column(String)
    event_id = Column(Integer, ForeignKey("events.id"))
    total_cans = Column(Integer, default=0)  # Running total for leaderboard
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    event = relationship("Event", back_populates="students")
    reservations = relationship("MapReservation", back_populates="student")


class Donation(Base):
    """
    Donation Model - Records individual can donations.
    
    Each donation links to either a Student OR a Teacher (never both).
    The donation_date field enables daily leaderboard tracking with
    timezone-aware timestamps (stored in UTC).
    
    Important: When a donation is recorded, the corresponding Student/Teacher
    total_cans field is also incremented for fast leaderboard queries.
    """
    __tablename__ = "donations"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    admin_id = Column(Integer, ForeignKey("admins.id"))  # Who recorded the donation
    amount = Column(Integer)  # Number of cans
    note = Column(Text, nullable=True)  # Optional notes
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    donation_date = Column(DateTime, default=datetime.datetime.utcnow)  # For daily tracking (UTC)
    
    # Relationships
    event = relationship("Event", back_populates="donations")


class Teacher(Base):
    """
    Teacher Model - Represents a teacher participating in the can drive.
    
    Teachers can donate cans and are included in class totals if they
    have a homeroom_number. Their donations count toward their homeroom's
    class buyout eligibility.
    """
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    full_name = Column(String)  # Full name for display purposes
    event_id = Column(Integer, ForeignKey("events.id"))
    total_cans = Column(Integer, default=0)
    homeroom_number = Column(String, nullable=True)  # Only if they have a homeroom
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    event = relationship("Event")


class Admin(Base):
    """
    Admin Model - System administrators who can access the admin dashboard.
    
    Admins can record donations, manage students/teachers, view full
    leaderboards, and export data. Password is stored as SHA256 hash.
    
    Default admin credentials are created on application startup if not exists.
    """
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    password_hash = Column(String)  # SHA256 hash of password
    email = Column(String, nullable=True)
    role = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)


class Award(Base):
    """
    Award Model - Defines prizes/awards for the can drive (future feature).
    
    This model is prepared for future award tracking functionality.
    """
    __tablename__ = "awards"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    title = Column(String)
    description = Column(Text)
    criteria = Column(String)
    quantity = Column(Integer)
    created_by = Column(Integer, ForeignKey("admins.id"))


class MapReservation(Base):
    """
    MapReservation Model - Stores street reservations for can collection.
    
    Students can reserve streets on the Google Maps interface. The geojson
    field stores path coordinates for rendering street highlights on the map.
    
    Key Fields:
        geojson: JSON string containing street path coordinates and metadata.
                 Format: [{ lat, lng, name, path: [{lat, lng}, ...] }]
                 The path array is used to draw Polylines on the map.
        group_members: Comma-separated names of group collection partners.
    """
    __tablename__ = "map_reservations"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    name = Column(String)  # Name of person who made reservation
    street_name = Column(String)  # Full street address from Google Places
    group_members = Column(Text, nullable=True)  # Comma-separated group member names
    geojson = Column(Text, nullable=True)  # Path coordinates for map highlighting
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    event_id = Column(Integer, ForeignKey("events.id"))
    
    # Relationships
    student = relationship("Student", back_populates="reservations")