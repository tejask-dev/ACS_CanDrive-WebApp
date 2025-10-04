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
    STUDENTS: (eventId: string) => `/events/${eventId}/students`,
    STUDENT_BY_ID: (eventId: string, studentId: string) => `/events/${eventId}/students/${studentId}`,
    DONATIONS: (eventId: string) => `/events/${eventId}/donations`,
    LEADERBOARD: (eventId: string) => `/events/${eventId}/leaderboard`,
    EXPORT: (eventId: string) => `/events/${eventId}/export`,
    MAP_RESERVATIONS: (eventId: string) => `/events/${eventId}/map-reservations`,
    RESET: (eventId: string) => `/events/${eventId}/reset`,
  },
};