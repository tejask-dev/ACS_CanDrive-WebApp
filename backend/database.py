from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
from dotenv import load_dotenv
import os

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./can_drive.db")

# Configure connection pool for production
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # PostgreSQL configuration for Render Professional Plan - Conservative settings
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=3,  # Conservative pool size
        max_overflow=5,  # Limited overflow connections
        pool_timeout=60,  # Increased timeout to 60 seconds
        pool_recycle=1800,  # Recycle connections every 30 minutes
        pool_pre_ping=True,  # Verify connections before use
        connect_args={"sslmode": "require"}
    )
else:
    # SQLite configuration for local development
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False}
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