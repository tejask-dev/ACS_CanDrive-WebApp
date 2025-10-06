import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Autocomplete,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { School, Person } from '@mui/icons-material';
import { toast } from 'sonner';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

interface TeacherOption {
  id: string;
  name: string;
  homeroomNumber?: string;
}

const TeacherSignup = () => {
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load all teachers on component mount
  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.TEACHERS('1'));
      const teachers = response.data.map((teacher: any) => ({
        id: teacher.id,
        name: teacher.full_name || `${teacher.first_name} ${teacher.last_name}`,
        homeroomNumber: teacher.homeroom_number
      }));
      setTeacherOptions(teachers);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Failed to load teachers');
    }
  };

  const handleTeacherSelect = (teacher: TeacherOption | null) => {
    setSelectedTeacher(teacher);
  };

  const handleSignup = async () => {
    if (!selectedTeacher) {
      toast.error('Please select a teacher');
      return;
    }

    setLoading(true);
    try {
      // For teacher signup, we just need to verify they exist in the system
      // No additional signup process needed since teachers are pre-loaded
      toast.success(`Welcome ${selectedTeacher.name}! You can now make donations and view the leaderboard.`);
      
      // Reset form
      setSelectedTeacher(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Error during teacher signup:', error);
      toast.error('Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <School sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Teacher Signup
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Select your name to access the teacher portal
        </Typography>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Teacher Portal Access:</strong> Select your name from the list below to access teacher features including donations and leaderboard viewing.
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Select Your Name
          </Typography>
          
          <Autocomplete
            options={teacherOptions}
            value={selectedTeacher}
            onChange={(_, newValue) => handleTeacherSelect(newValue)}
            onInputChange={(_, newValue) => setSearchQuery(newValue)}
            getOptionLabel={(option) => option?.name || ''}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search for your name"
                placeholder="Type to search..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {option.name}
                  </Typography>
                  {option.homeroomNumber && (
                    <Chip 
                      label={`Room ${option.homeroomNumber}`} 
                      size="small" 
                      variant="outlined" 
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
              </Box>
            )}
            noOptionsText="No teachers found"
            loading={loading}
          />
        </Box>

        {selectedTeacher && (
          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.50', 
            borderRadius: 2, 
            mb: 3,
            border: '1px solid',
            borderColor: 'primary.200'
          }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              Selected Teacher:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              <Typography variant="body1">
                {selectedTeacher.name}
              </Typography>
              {selectedTeacher.homeroomNumber && (
                <Chip 
                  label={`Room ${selectedTeacher.homeroomNumber}`} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={handleSignup}
          disabled={!selectedTeacher || loading}
          sx={{ 
            width: '100%', 
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Access Teacher Portal'
          )}
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          After signing up, you can make donations and view the leaderboard
        </Typography>
      </Paper>
    </Box>
  );
};

export default TeacherSignup;
