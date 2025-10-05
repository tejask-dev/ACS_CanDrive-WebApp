export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  EVENTS: {
    LIST: '/events',
    CREATE: '/events',
    UPLOAD_ROSTER: (eventId: string) => `/events/${eventId}/upload-roster`,
    UPLOAD_TEACHERS: (eventId: string) => `/events/${eventId}/upload-teachers`,
    STUDENTS: (eventId: string) => `/events/${eventId}/students`,
    TEACHERS: (eventId: string) => `/events/${eventId}/teachers`,
    STUDENT_BY_ID: (eventId: string, studentId: string) => `/events/${eventId}/students/${studentId}`,
    DONATIONS: (eventId: string) => `/events/${eventId}/donations`,
    LEADERBOARD: (eventId: string) => `/events/${eventId}/leaderboard`,
    DAILY_DONORS: (eventId: string) => `/events/${eventId}/daily-donors`,
    EXPORT: (eventId: string) => `/events/${eventId}/export`,
    EXPORT_CSV: (eventId: string) => `/events/${eventId}/map-reservations/export.csv`,
    MAP_RESERVATIONS: (eventId: string) => `/events/${eventId}/map-reservations`,
    RESET: (eventId: string) => `/events/${eventId}/reset`,
  },
};