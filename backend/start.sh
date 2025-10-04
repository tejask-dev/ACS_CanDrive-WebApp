#!/bin/bash
# Start script for Render deployment

# Install dependencies
pip install -r requirements.txt

# Create database tables
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"

# Create admin user if it doesn't exist
python -c "
from database import get_db
from models import Admin
from datetime import datetime
import hashlib

try:
    db = next(get_db())
    existing_admin = db.query(Admin).filter(Admin.username == 'ACS_CanDrive').first()
    if not existing_admin:
        admin = Admin(
            username='ACS_CanDrive',
            password_hash=hashlib.sha256('Assumption_raiders'.encode()).hexdigest(),
            created_at=datetime.now()
        )
        db.add(admin)
        db.commit()
        print('Admin user created successfully!')
    else:
        print('Admin user already exists')
except Exception as e:
    print(f'Error creating admin user: {e}')
"

# Start the application
uvicorn main:app --host 0.0.0.0 --port $PORT
