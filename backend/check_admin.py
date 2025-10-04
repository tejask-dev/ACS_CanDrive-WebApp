#!/usr/bin/env python3
"""
Script to check and create admin user
"""
from database import get_db
from models import Admin
from datetime import datetime
import hashlib

def check_and_create_admin():
    try:
        db = next(get_db())
        
        # Check if admin exists
        admin = db.query(Admin).filter(Admin.username == 'ACS_CanDrive').first()
        
        if admin:
            print(f"✅ Admin user exists: {admin.username}")
            print(f"   Created at: {admin.created_at}")
            print(f"   Password hash: {admin.password_hash[:20]}...")
        else:
            print("❌ Admin user not found. Creating...")
            
            # Create admin user
            admin = Admin(
                username='ACS_CanDrive',
                password_hash=hashlib.sha256('Assumption_raiders'.encode()).hexdigest(),
                created_at=datetime.now()
            )
            db.add(admin)
            db.commit()
            print("✅ Admin user created successfully!")
            print(f"   Username: ACS_CanDrive")
            print(f"   Password: Assumption_raiders")
            print(f"   Password hash: {admin.password_hash[:20]}...")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_and_create_admin()
