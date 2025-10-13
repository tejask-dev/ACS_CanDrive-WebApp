export interface Event {
  id: string;
  name: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  eventId: string;
  name: string;
  grade: string | number; // Backend returns as string, but we handle both
  homeroomNumber: string;
  homeroomTeacher: string;
  totalCans: number;
  reservedStreets: string[];
  createdAt: string;
}

export interface Donation {
  id: string;
  studentId: string;
  eventId: string;
  cans: number;
  date: string;
  notes?: string;
}

export interface MapReservation {
  id: string;
  eventId: string;
  studentId: string;
  studentName: string;
  streetName: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  grade?: number;
  homeroomNumber?: string;
  totalCans: number;
  change?: number;
}

export interface ClassBuyoutEntry {
  class_name: string;
  homeroom_teacher: string;
  homeroom_number: string;
  student_count: number;
  required_cans: number;
  actual_cans: number;
  is_eligible: boolean;
  progress_percentage: number;
}

export interface LeaderboardData {
  topStudents: LeaderboardEntry[];
  topTeachers?: LeaderboardEntry[];
  topClasses: LeaderboardEntry[];
  topGrades: LeaderboardEntry[];
  classBuyout?: ClassBuyoutEntry[];
  totalCans: number;
}

export interface Award {
  id: string;
  eventId: string;
  name: string;
  description: string;
  criteria: string;
  winnerId?: string;
  winnerName?: string;
}
