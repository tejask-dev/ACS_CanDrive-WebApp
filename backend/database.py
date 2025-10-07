from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
from dotenv import load_dotenv
import os

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./can_drive.db")

# Configure connection pool for production
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # PostgreSQL configuration for Render Professional Plan - Ultra Conservative settings
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=2,  # Very conservative pool size
        max_overflow=3,  # Minimal overflow connections
        pool_timeout=90,  # Extended timeout to 90 seconds
        pool_recycle=1200,  # Recycle connections every 20 minutes
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