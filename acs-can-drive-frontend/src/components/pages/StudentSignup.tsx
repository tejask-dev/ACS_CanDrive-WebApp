import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  AppBar,
  Toolbar,
  IconButton,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Map as MapIcon } from '@mui/icons-material';
import { toast } from 'sonner';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import MapReservation from '@/components/students/MapReservation';

const StudentSignup = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    homeroomNumber: '',
    homeroomTeacher: '',
    eventId: '1',
  });
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentOptions, setStudentOptions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const steps = ['Verify Name', 'Reserve Streets'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setStudentOptions([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await api.get(`${API_ENDPOINTS.EVENTS.STUDENTS(formData.eventId)}/search`, {
        params: { q: query }
      });
      setStudentOptions(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setStudentOptions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStudentSelect = (student: any) => {
    if (student) {
      setFormData({
        ...formData,
        name: student.name,
      });
      setStudentId(student.id);
      toast.success('Student found! You can proceed to street reservation.');
    }
  };

  const handleSubmitInfo = async () => {
    if (!studentId) {
      toast.error('Please select your name from the list');
      return;
    }
    
    try {
      // Verify the student exists in the roster
      const verifyResponse = await api.post(`${API_ENDPOINTS.EVENTS.STUDENTS(formData.eventId)}/verify`, {
        first_name: formData.name.split(' ')[0],
        last_name: formData.name.split(' ').slice(1).join(' '),
      });
      
      setStudentId(verifyResponse.data.id);
      setActiveStep(1);
      toast.success('Student verified! You can now reserve streets.');
    } catch (error) {
      toast.error('Student not found in roster. Please check your name or contact admin.');
      console.error(error);
    }
  };

  const handleComplete = () => {
    toast.success('All set! Your streets have been reserved.');
    setTimeout(() => navigate('/'), 2000);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ACS Can Drive - Student Street Signup
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  Verify Your Name
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Search for your name in the database to verify you're registered for the can drive.
                  </Typography>
                  
                  <Autocomplete
                    freeSolo
                    options={studentOptions}
                    getOptionLabel={(option) => option.name || option}
                    value={formData.name}
                    onInputChange={(_, value) => {
                      setFormData({ ...formData, name: value });
                      searchStudents(value);
                    }}
                    onChange={(_, value) => handleStudentSelect(value)}
                    loading={searchLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search for your name"
                        name="name"
                        required
                        placeholder="Start typing your name..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body1">{option.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Grade {option.grade} • {option.homeroomTeacher} • Room {option.homeroomNumber}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmitInfo}
                    disabled={!studentId}
                    sx={{
                      background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
                      color: 'white',
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 700,
                      mt: 2,
                    }}
                  >
                    Next: Reserve Streets
                  </Button>
                </Box>
              </motion.div>
            )}

            {activeStep === 1 && studentId && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <MapIcon color="primary" sx={{ fontSize: 32 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Reserve Your Collection Streets
                  </Typography>
                </Box>

                <Typography sx={{ mb: 3, color: 'text.secondary' }}>
                  Search for streets or click on the map to reserve them. Reserved streets will show your initials.
                </Typography>

                <MapReservation
                  eventId={formData.eventId}
                  studentId={studentId}
                  studentName={formData.name}
                  onComplete={handleComplete}
                />
              </motion.div>
            )}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default StudentSignup;
