from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Admin
from schemas import AdminLogin, AdminChangePassword
import jwt
from datetime import datetime, timedelta
import os
import hashlib

SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
router = APIRouter()

# Simple database helper for admin operations
def get_db_simple():
    """Get database connection - simple for SQLite"""
    from database import get_db
    return next(get_db())

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=8)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

@router.post("/login")
def login(payload: AdminLogin):
    try:
        db = get_db_simple()
        admin = db.query(Admin).filter(Admin.username == payload.username).first()
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Hash the provided password and compare
        provided_password_hash = hashlib.sha256(payload.password.encode()).hexdigest()
        if provided_password_hash != admin.password_hash:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_access_token({"sub": admin.username})
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/change-password")
def change_password(payload: AdminChangePassword):
    try:
        db = get_db_simple()
        admin = db.query(Admin).filter(Admin.username == payload.username).first()
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify old password
        old_password_hash = hashlib.sha256(payload.old_password.encode()).hexdigest()
        if old_password_hash != admin.password_hash:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Set new password
        admin.password_hash = hashlib.sha256(payload.new_password.encode()).hexdigest()
        db.commit()
        return {"msg": "Password updated"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Change password error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
