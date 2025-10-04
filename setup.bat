@echo off
REM ACS Can Drive Web Application Setup Script for Windows
echo 🚀 Setting up ACS Can Drive Web Application...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

echo ✅ Python and Node.js are installed

REM Setup Backend
echo 📦 Setting up backend...
cd backend

REM Create virtual environment
echo Creating Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Create admin user
echo Creating admin user...
python -c "from database import get_db; from models import Admin; from datetime import datetime; import hashlib; db = next(get_db()); admin = Admin(username='ACS_CanDrive', password_hash=hashlib.sha256('Assumption_raiders'.encode()).hexdigest(), created_at=datetime.now()); db.add(admin); db.commit(); print('✅ Admin user created successfully!')" 2>nul || echo ⚠️  Admin user might already exist

cd ..

REM Setup Frontend
echo 📦 Setting up frontend...
cd acs-can-drive-frontend

REM Install Node.js dependencies
echo Installing Node.js dependencies...
npm install

cd ..

echo.
echo 🎉 Setup complete!
echo.
echo To start the application:
echo 1. Backend: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo 2. Frontend: cd acs-can-drive-frontend ^&^& npm run dev
echo.
echo Admin credentials:
echo Username: ACS_CanDrive
echo Password: Assumption_raiders
echo.
echo Access the application at: http://localhost:5173
pause
