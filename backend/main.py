from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import admin, events, students, donations, map_reservations
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://acs-can-drive-webapp.vercel.app",  # Replace with your actual Vercel URL
        "https://*.vercel.app",  # Allow all Vercel previews
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(admin.router, prefix="/api/auth", tags=["auth"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(students.router, prefix="/api/events/{event_id}/students", tags=["students"])
app.include_router(donations.router, prefix="/api/events/{event_id}/donations", tags=["donations"])
app.include_router(map_reservations.router, prefix="/api/events/{event_id}/map-reservations", tags=["map"])

@app.get("/")
def read_root():
    return {"msg": "ACS Can Drive API running"}