from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
from dotenv import load_dotenv
import os

load_dotenv()

# Force SQLite - ignore any PostgreSQL DATABASE_URL that might be set
# Override any environment variables that might point to PostgreSQL
import os
os.environ.pop('DATABASE_URL', None)  # Remove any PostgreSQL URL

# Use persistent disk if available, otherwise use local path
if os.path.exists('/mnt/disk'):
    SQLALCHEMY_DATABASE_URL = "sqlite:////mnt/disk/can_drive.db"
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./can_drive.db"

# Simple SQLite configuration - no connection pooling needed
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=None,  # Explicitly disable connection pooling
    pool_timeout=None,  # No timeout
    pool_recycle=None,  # No recycling
    pool_pre_ping=False,  # No pre-ping
    pool_size=None,  # No pool size
    max_overflow=None  # No overflow
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)