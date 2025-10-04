# ACS Can Drive Web Application

A comprehensive web application for managing school can drive events, student registrations, street reservations, and leaderboard tracking.

## 🚀 Features

### Student Features
- **Student Registration**: Students can sign up and verify their information against the school roster
- **Street Reservation**: Interactive map-based street reservation system
- **Group Collections**: Support for group can collection with member tracking
- **Auto-fill Information**: Automatic form filling when student name is recognized

### Admin Features
- **Dashboard**: Comprehensive admin dashboard with real-time statistics
- **Student Management**: View, search, and manage all registered students
- **Donation Recording**: Record can donations for individual students
- **Leaderboard Management**: View and export leaderboard data
- **Map Reservations**: Monitor and export street reservations
- **Excel Roster Upload**: Bulk upload student rosters from Excel files
- **Data Export**: Export data in CSV format

### Public Features
- **Live Leaderboard**: Real-time leaderboard showing top students, classes, and grades
- **Responsive Design**: Mobile-friendly interface
- **Modern UI**: Beautiful, intuitive user interface

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Material-UI (MUI)** for UI components
- **React Router DOM** for navigation
- **Framer Motion** for animations
- **Axios** for API calls
- **React Query** for data fetching
- **Google Maps API** for map functionality

### Backend
- **FastAPI** (Python web framework)
- **SQLAlchemy** (ORM)
- **SQLite** database
- **Pydantic** for data validation
- **JWT** for authentication
- **Bcrypt** for password hashing
- **OpenPyXL** for Excel file processing

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd School-Can-drive-WebApp
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"

# Create admin user
python -c "
from database import get_db
from models import Admin
from datetime import datetime
import hashlib

db = next(get_db())
admin = Admin(
    username='ACS_CanDrive',
    password_hash=hashlib.sha256('Assumption_raiders'.encode()).hexdigest(),
    created_at=datetime.now()
)
db.add(admin)
db.commit()
print('Admin user created!')
"

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd acs-can-drive-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Environment Variables
Create a `.env` file in the frontend directory:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 🔧 Configuration

### Google Maps Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Maps JavaScript API
3. Create an API key
4. Add the key to your `.env` file

### Database Configuration
The application uses SQLite by default. To use a different database:
1. Update the database URL in `backend/database.py`
2. Install the appropriate database driver
3. Run migrations

## 📱 Usage

### Admin Access
- **URL**: `http://localhost:5173/admin/login`
- **Username**: `ACS_CanDrive`
- **Password**: `Assumption_raiders`

### Student Registration
1. Go to `http://localhost:5173`
2. Click "Student Signup"
3. Enter your name (auto-complete will suggest matches)
4. Complete the form with your information
5. Reserve streets on the interactive map

### Admin Dashboard
1. Login with admin credentials
2. Upload student roster via Excel file
3. Record donations for students
4. Monitor reservations and leaderboard
5. Export data as needed

## 📊 Data Management

### Uploading Student Roster
1. Go to Admin Dashboard → Events
2. Upload an Excel file with columns:
   - `Name` or `First Name`/`Last Name`
   - `Grade`
   - `Homeroom` or `Room`
   - `Teacher` or `Homeroom Teacher`

### Recording Donations
1. Go to Admin Dashboard → Donations
2. Search for student by name
3. Enter number of cans donated
4. Add optional notes
5. Save the donation

### Exporting Data
- **Leaderboard**: Export current leaderboard data as CSV
- **Map Reservations**: Export street reservations as CSV
- **Student Data**: Export student information

## 🗂️ Project Structure

```
School-Can-drive-WebApp/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── database.py             # Database configuration
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── routers/                # API route handlers
│   │   ├── admin.py            # Admin authentication
│   │   ├── events.py           # Event management
│   │   ├── students.py         # Student management
│   │   ├── donations.py        # Donation tracking
│   │   └── map_reservations.py # Street reservations
│   └── requirements.txt        # Python dependencies
├── acs-can-drive-frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── pages/          # Page components
│   │   │   ├── admin/          # Admin dashboard components
│   │   │   ├── students/       # Student-specific components
│   │   │   └── ui/             # Reusable UI components
│   │   ├── services/           # API services
│   │   ├── types/              # TypeScript type definitions
│   │   └── config/             # Configuration files
│   ├── public/                 # Static assets
│   └── package.json            # Node.js dependencies
└── README.md                   # This file
```

## 🔒 Security Features

- JWT-based authentication for admin access
- Password hashing with SHA256
- Input validation and sanitization
- CORS configuration for API security
- SQL injection prevention with SQLAlchemy ORM

## 🚀 Deployment

### Backend Deployment
1. Set up a production database (PostgreSQL recommended)
2. Update database URL in `database.py`
3. Set environment variables for production
4. Deploy using Docker or a cloud service

### Frontend Deployment
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to a web server
3. Configure environment variables for production

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check if Python virtual environment is activated
- Verify all dependencies are installed
- Check if port 8000 is available

**Frontend won't start:**
- Ensure Node.js 18+ is installed
- Run `npm install` to install dependencies
- Check if port 5173 is available

**Database errors:**
- Run database migrations
- Check database file permissions
- Verify database schema

**Google Maps not loading:**
- Verify API key is correct
- Check if Maps JavaScript API is enabled
- Ensure API key has proper restrictions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added group collection support
- **v1.2.0** - Enhanced admin dashboard
- **v1.3.0** - Added export functionality
- **v1.4.0** - Improved UI/UX and performance

---

**Made with ❤️ for ACS Can Drive Events**
