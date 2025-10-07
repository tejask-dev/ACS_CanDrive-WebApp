from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
from dotenv import load_dotenv
import os

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./can_drive.db")

# Configure connection pool for production
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # PostgreSQL configuration for Render Professional Plan
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=5,  # Increased pool size for professional plan
        max_overflow=10,  # Allow overflow connections
        pool_timeout=30,  # 30 second timeout
        pool_recycle=3600,  # Recycle connections every hour
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