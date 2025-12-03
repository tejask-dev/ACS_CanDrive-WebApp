"""
Database Configuration for ACS Can Drive
=========================================

This module handles database connectivity and session management using
SQLAlchemy ORM with SQLite database.

Database Storage:
- Development: ./can_drive.db (local file)
- Production (Render): /mnt/disk/can_drive.db (persistent disk)

The persistent disk path is automatically detected and used when available,
ensuring data survives container restarts on cloud hosting platforms.

Key Components:
- engine: SQLAlchemy engine for database connections
- SessionLocal: Session factory for creating database sessions
- get_db(): Dependency injection helper for FastAPI routes
- init_db(): Creates all database tables from models

SQLite Configuration:
- check_same_thread=False: Required for FastAPI's async handling
- No connection pooling: SQLite handles this internally

Author: ACS Can Drive Development Team
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Force SQLite - ignore any PostgreSQL DATABASE_URL that might be set
# This ensures consistent behavior across development and production
os.environ.pop('DATABASE_URL', None)

# Database path selection:
# - Use persistent disk on Render.com for production
# - Use local path for development
if os.path.exists('/mnt/disk'):
    SQLALCHEMY_DATABASE_URL = "sqlite:////mnt/disk/can_drive.db"
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./can_drive.db"

# Create SQLAlchemy engine
# check_same_thread=False is required for SQLite with FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# Session factory - creates new database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    Dependency injection helper for FastAPI routes.
    
    Creates a new database session for each request and ensures
    it is closed when the request completes.
    
    Usage:
        @app.get("/endpoint")
        def my_endpoint(db: Session = Depends(get_db)):
            # Use db for queries
            pass
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize the database by creating all tables.
    
    This function creates all tables defined in models.py if they
    don't already exist. Called on application startup.
    """
    Base.metadata.create_all(bind=engine)