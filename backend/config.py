"""
Backend Configuration
=====================

Central location for application configuration and constants.
This ensures that values like the current event ID are easily configurable
for future years without modifying code across multiple files.

FUTURE YEAR USAGE:
==================
To start a new can drive event for a new year:

1. Update CURRENT_EVENT_ID to the next number (e.g., 2)
2. The system will automatically create the new event on startup
3. All new data will be associated with the new event ID
4. Previous year's data remains intact with the old event ID

This design allows:
- Historical data preservation
- Easy year-over-year comparisons
- Clean separation between annual events
- No code changes needed (just this config value)

Author: ACS Can Drive Development Team
"""
import os

# =============================================================================
# EVENT CONFIGURATION
# =============================================================================

# Current active event ID - CHANGE THIS FOR NEW YEARS
# Increment this value when starting a new can drive event
# Example: 2026 can drive would use CURRENT_EVENT_ID = 2
CURRENT_EVENT_ID = 1

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# Default database URL (can be overridden by environment variable)
DATABASE_URL = "sqlite:///./can_drive.db"

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# JWT token settings
# In production, SECRET_KEY should be set via environment variable
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# =============================================================================
# ADMIN CREDENTIALS (Default - should be changed in production)
# =============================================================================
# Default admin is created on startup if not exists
# Username: ACS_CanDrive
# Password: Assumption_raiders

