import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { ArrowBack, School } from '@mui/icons-material';
import { toast } from 'sonner';
import MapReservation from '@/components/students/MapReservation';

const TeacherMapReservation = () => {
  const navigate = useNavigate();
  const [teacherInfo, setTeacherInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get teacher info from session storage
    const storedTeacher = sessionStorage.getItem('selectedTeacher');
    if (storedTeacher) {
      setTeacherInfo(JSON.parse(storedTeacher));
    } else {
      // If no teacher info, redirect back to signup
      toast.error('Please select a teacher first');
      navigate('/teacher-signup');
    }
    setLoading(false);
  }, [navigate]);

  const handleComplete = () => {
    toast.success('Street reservation completed!');
    setTimeout(() => navigate('/'), 2000);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!teacherInfo) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert severity="error">
          No teacher information found. Please go back and select a teacher.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/teacher-signup')}
          sx={{ mt: 2 }}
        >
          Back to Teacher Signup
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, hsl(200, 60%, 55%) 0%, hsl(200, 60%, 45%) 100%)' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/teacher-signup')}>
            <ArrowBack />
          </IconButton>
          <School sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Teacher Street Reservation - {teacherInfo.name}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 3, mb: 2, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Welcome, {teacherInfo.name}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select streets on the map below to reserve them for your collection area.
            {teacherInfo.homeroomNumber && ` You are assigned to room ${teacherInfo.homeroomNumber}.`}
          </Typography>
        </Paper>

        <MapReservation
          eventId="1"
          studentId={teacherInfo.id}
          studentName={teacherInfo.name}
          onComplete={handleComplete}
          isTeacher={true}
        />
      </Box>
    </Box>
  );
};

export default TeacherMapReservation;
