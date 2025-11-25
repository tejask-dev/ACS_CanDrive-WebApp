"""
Backend Configuration
=====================

Central location for application configuration and constants.
This ensures that values like the current event ID are easily configurable
for future years without modifying code across multiple files.
"""
import os

# Current active event ID
# Change this value when starting a new can drive event year
CURRENT_EVENT_ID = 1

# Database configuration
DATABASE_URL = "sqlite:///./can_drive.db"

# Security configuration (should use env vars in production)
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

