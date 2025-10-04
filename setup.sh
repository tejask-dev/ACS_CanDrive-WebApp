#!/bin/bash

# ACS Can Drive Web Application Setup Script
echo "🚀 Setting up ACS Can Drive Web Application..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✅ Python and Node.js are installed"

# Setup Backend
echo "📦 Setting up backend..."
cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create admin user
echo "Creating admin user..."
python3 -c "
from database import get_db
from models import Admin
from datetime import datetime
import hashlib

try:
    db = next(get_db())
    admin = Admin(
        username='ACS_CanDrive',
        password_hash=hashlib.sha256('Assumption_raiders'.encode()).hexdigest(),
        created_at=datetime.now()
    )
    db.add(admin)
    db.commit()
    print('✅ Admin user created successfully!')
except Exception as e:
    print(f'⚠️  Admin user might already exist: {e}')
"

cd ..

# Setup Frontend
echo "📦 Setting up frontend..."
cd acs-can-drive-frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo "2. Frontend: cd acs-can-drive-frontend && npm run dev"
echo ""
echo "Admin credentials:"
echo "Username: ACS_CanDrive"
echo "Password: Assumption_raiders"
echo ""
echo "Access the application at: http://localhost:5173"
