# 🥫 ACS Can Drive Web Application

A comprehensive, modern web application for managing school can drive events with real-time leaderboards, interactive street reservations, and secure admin management.

![ACS Can Drive](https://img.shields.io/badge/ACS-Can%20Drive-purple?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-green?style=for-the-badge&logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)

## 🌟 Overview

The ACS Can Drive Web Application is a full-stack solution designed specifically for Assumption College School's annual can drive events. It provides students, teachers, and administrators with a modern, intuitive platform to manage donations, track progress, and create excitement around the fundraising campaign.

### 🎯 Key Features

- **🔐 Secure Admin Dashboard** - Password-protected admin interface with comprehensive management tools
- **🗺️ Interactive Street Reservations** - Google Maps integration for street selection and group coordination
- **📊 Real-time Leaderboards** - Live tracking of top students, classes, and grades with daily updates
- **🎉 Assembly-Ready Features** - Password-protected leaderboard reveal with confetti animations
- **📱 Mobile-Responsive Design** - Optimized for all devices and screen sizes
- **📈 Advanced Analytics** - Detailed reporting and data export capabilities
- **🎯 Class Buyout System** - Special feature for class-based fundraising goals

## 🚀 Live Demo

**Production URL**: [acscandrive.ca](https://acscandrive.ca)

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast build tooling
- **Material-UI (MUI)** for beautiful, consistent UI components
- **Framer Motion** for smooth animations and transitions
- **React Router DOM** for client-side routing
- **TanStack Query** for efficient data fetching and caching
- **Google Maps API** for interactive street selection
- **Axios** for HTTP client with automatic token management

### Backend
- **FastAPI** for high-performance Python web framework
- **SQLAlchemy** with SQLite for robust database management
- **Pydantic** for automatic data validation and serialization
- **JWT** for secure authentication and session management
- **OpenPyXL** for Excel file processing and roster uploads
- **Uvicorn** for ASGI server with hot reloading

### Security Features
- **JWT Authentication** with automatic token refresh
- **Password Hashing** using SHA256 for secure credential storage
- **Route Protection** preventing unauthorized admin access
- **Input Validation** and sanitization on all user inputs
- **CORS Configuration** for secure cross-origin requests

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **Git** for version control
- **Google Maps API Key** (for street selection features)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/tejask-dev/ACS_CanDrive-WebApp.git
cd ACS_CanDrive-WebApp
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database and create admin user
python -c "
from database import SessionLocal
from models import Admin, Base
from datetime import datetime
import hashlib

# Create tables
Base.metadata.create_all(bind=SessionLocal().bind)

# Create admin user
db = SessionLocal()
admin = Admin(
    username='ACS_CanDrive',
    password_hash=hashlib.sha256('Assumption_raiders'.encode()).hexdigest(),
    created_at=datetime.now()
)
db.add(admin)
db.commit()
print('✅ Admin user created successfully!')
db.close()
"

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd acs-can-drive-frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here" > .env

# Start development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Configuration

### Google Maps Setup
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Maps JavaScript API**
4. Create an API key with appropriate restrictions
5. Add the key to your `.env` file

### Environment Variables

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### Backend (Optional)
```env
DATABASE_URL=sqlite:///./can_drive.db
SECRET_KEY=your-secret-key-here
```

## 📱 User Guide

### 👨‍🎓 Student Registration
1. Navigate to the homepage
2. Click **"Student Street Signup"**
3. Enter your name (auto-complete will suggest matches from roster)
4. Complete the registration form
5. Select streets on the interactive map
6. Add group members if collecting as a team

### 👩‍🏫 Teacher Registration
1. Click **"Teacher Street Signup"**
2. Enter teacher information
3. Reserve streets for your class
4. Monitor student progress

### 🔐 Admin Dashboard
**Login Credentials:**
- **Username**: `ACS_CanDrive`
- **Password**: `Assumption_raiders`
- **URL**: `/admin/login`

#### Admin Features:
- **Dashboard Overview** - Real-time statistics and charts
- **Student Management** - View, edit, and manage all students
- **Teacher Management** - Manage teacher accounts and classes
- **Donation Recording** - Record can donations for students
- **Leaderboard Management** - View and export leaderboard data
- **Map Reservations** - Monitor and export street reservations
- **Class Buyout** - Track class fundraising goals
- **Data Export** - Export all data in CSV format

### 🏆 Public Leaderboard
- **Live Updates** - Real-time leaderboard with automatic refresh
- **Multiple Categories** - Top students, classes, grades, and daily donors
- **Class Buyout Progress** - Track class fundraising goals
- **Assembly Mode** - Password-protected reveal for special events

## 🎉 Special Features

### Assembly-Ready Leaderboard
- **Password Protection** - Secure leaderboard reveal for assemblies
- **Confetti Animation** - Celebratory effects when accessing results
- **Hidden Numbers** - Keep final results secret until reveal
- **Password**: `Assumption_raiders` (same as admin login)

### Class Buyout System
- **Eligibility Tracking** - Classes need 10 cans per student to qualify
- **Progress Monitoring** - Real-time progress bars and percentages
- **Admin Management** - Full control over class buyout settings

### Daily Donor Tracking
- **Daily Reset** - Automatically resets at 3 AM Eastern Time
- **Today's Donations** - Shows only today's contributions
- **Cumulative Totals** - Separate tracking for overall progress

## 📊 Data Management

### Uploading Student Roster
1. Go to **Admin Dashboard → Events**
2. Upload Excel file with columns:
   - `Name` or `First Name`/`Last Name`
   - `Grade`
   - `Homeroom` or `Room`
   - `Teacher` or `Homeroom Teacher`

### Recording Donations
1. Navigate to **Admin Dashboard → Donations**
2. Search for student by name
3. Enter number of cans donated
4. Add optional notes
5. Save the donation

### Exporting Data
- **Leaderboard CSV** - Complete leaderboard with rankings
- **Map Reservations** - All street reservations
- **Student Data** - Complete student information
- **Donation Records** - All donation transactions

## 🗂️ Project Structure

```
ACS_CanDrive-WebApp/
├── 📁 backend/                    # FastAPI Backend
│   ├── 📄 main.py                 # Application entry point
│   ├── 📄 database.py             # Database configuration
│   ├── 📄 models.py               # SQLAlchemy models
│   ├── 📄 schemas.py              # Pydantic schemas
│   ├── 📁 routers/                # API route handlers
│   │   ├── 📄 admin.py            # Admin authentication
│   │   ├── 📄 events.py           # Event management
│   │   ├── 📄 students.py         # Student management
│   │   ├── 📄 donations.py        # Donation tracking
│   │   └── 📄 map_reservations.py # Street reservations
│   ├── 📄 requirements.txt        # Python dependencies
│   └── 📄 render.yaml             # Deployment configuration
├── 📁 acs-can-drive-frontend/     # React Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/         # React components
│   │   │   ├── 📁 pages/          # Page components
│   │   │   │   ├── 📄 Landing.tsx # Homepage with leaderboard
│   │   │   │   ├── 📄 Leaderboard.tsx # Public leaderboard
│   │   │   │   ├── 📄 StudentSignup.tsx # Student registration
│   │   │   │   └── 📄 AdminLogin.tsx # Admin authentication
│   │   │   ├── 📁 admin/          # Admin dashboard components
│   │   │   │   ├── 📄 AdminDashboard.tsx # Main admin interface
│   │   │   │   ├── 📄 StudentManagement.tsx # Student CRUD
│   │   │   │   ├── 📄 DonationManagement.tsx # Donation recording
│   │   │   │   ├── 📄 LeaderboardView.tsx # Admin leaderboard
│   │   │   │   └── 📄 ClassBuyoutView.tsx # Class buyout tracking
│   │   │   ├── 📁 students/       # Student-specific components
│   │   │   │   └── 📄 MapReservation.tsx # Street selection
│   │   │   └── 📁 ui/             # Reusable UI components
│   │   ├── 📁 services/           # API services
│   │   ├── 📁 types/              # TypeScript definitions
│   │   └── 📁 config/             # Configuration files
│   ├── 📄 package.json            # Node.js dependencies
│   └── 📄 vite.config.ts          # Vite configuration
├── 📄 README.md                   # This file
└── 📄 vercel.json                 # Frontend deployment config
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure, stateless authentication
- **Route Protection** - Admin routes require valid authentication
- **Token Validation** - Automatic token verification on API calls
- **Session Management** - Secure logout and token cleanup

### Data Protection
- **Input Validation** - All user inputs are validated and sanitized
- **SQL Injection Prevention** - SQLAlchemy ORM prevents SQL injection
- **CORS Configuration** - Proper cross-origin request handling
- **Password Hashing** - Secure password storage with SHA256

### Admin Security
- **Protected Routes** - Direct URL access to admin dashboard is blocked
- **Token Verification** - All admin actions require valid authentication
- **Automatic Logout** - Invalid tokens trigger automatic logout

## 🚀 Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables:
   - `VITE_API_BASE_URL=https://your-backend-url.com/api`
   - `VITE_GOOGLE_MAPS_API_KEY=your_api_key`
3. Deploy automatically on git push

### Backend (Render)
1. Connect GitHub repository to Render
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add persistent disk for SQLite database
5. Set environment variables as needed

### Database Persistence
- **SQLite** for development and small deployments
- **PostgreSQL** recommended for production
- **Persistent Disk** required on Render for SQLite
- **Backup Strategy** - Regular CSV exports for data safety

## 🐛 Troubleshooting

### Common Issues

**Frontend won't start:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Backend connection errors:**
```bash
# Check if backend is running
curl http://localhost:8000/api/health

# Restart backend with verbose logging
uvicorn main:app --reload --log-level debug
```

**Google Maps not loading:**
- Verify API key is correct
- Check if Maps JavaScript API is enabled
- Ensure API key has proper domain restrictions

**Database errors:**
```bash
# Reset database
rm backend/can_drive.db
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"
```

**Admin login issues:**
- Verify admin user exists: `python -c "from database import get_db; from models import Admin; print([a.username for a in get_db().query(Admin).all()])"`
- Check password hash: `python -c "import hashlib; print(hashlib.sha256('Assumption_raiders'.encode()).hexdigest())"`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure mobile responsiveness

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **GitHub Issues**: [Create an issue](https://github.com/tejask-dev/ACS_CanDrive-WebApp/issues)
- **Email**: Contact the development team
- **Documentation**: Check this README and inline code comments

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added group collection support
- **v1.2.0** - Enhanced admin dashboard
- **v1.3.0** - Added export functionality
- **v1.4.0** - Improved UI/UX and performance
- **v1.5.0** - Added Class Buyout system
- **v1.6.0** - Assembly-ready leaderboard with password protection
- **v1.7.0** - Enhanced security and authentication

## 🎯 Future Enhancements

- [ ] **Mobile App** - Native iOS/Android applications
- [ ] **Push Notifications** - Real-time updates for donations
- [ ] **Advanced Analytics** - Detailed reporting and insights
- [ ] **Multi-Event Support** - Manage multiple can drive events
- [ ] **Integration APIs** - Connect with school management systems
- [ ] **Automated Emails** - Progress updates and reminders

---

**Made with ❤️ for ACS Can Drive Events**

*Empowering students to make a difference, one can at a time.*