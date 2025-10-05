import { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Autocomplete, Stack, Tabs, Tab, Chip } from '@mui/material';
import { School, Person } from '@mui/icons-material';
import api from '@/services/api';
import { API_ENDPOINTS, API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';

interface StudentOption { id: string; name: string; grade?: string; homeroomNumber?: string; }
interface TeacherOption { id: string; name: string; homeroomNumber?: string; }

const DonationManagement = () => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<StudentOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [selected, setSelected] = useState<StudentOption | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherOption | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [donorType, setDonorType] = useState<'student' | 'teacher'>('student');

  const searchStudents = async (text: string) => {
    setQuery(text);
    if (text.length < 2) return;
    try {
      const res = await api.get(`${API_ENDPOINTS.EVENTS.STUDENTS('1')}/search`, { params: { q: text } });
      setOptions(res.data);
    } catch (e) {
      // ignore
    }
  };

  const searchTeachers = async (text: string) => {
    setQuery(text);
    if (text.length < 2) return;
    try {
      const res = await api.get(API_ENDPOINTS.EVENTS.TEACHERS('1'));
      const teachers = res.data.filter((teacher: any) => 
        teacher.full_name.toLowerCase().includes(text.toLowerCase())
      );
      setTeacherOptions(teachers.map((t: any) => ({
        id: t.id,
        name: t.full_name,
        homeroomNumber: t.homeroom_number
      })));
    } catch (e) {
      // ignore
    }
  };

  const submit = async () => {
    if (donorType === 'student' && (!selected || amount <= 0)) {
      toast.error('Select a student and enter a positive number of cans');
      return;
    }
    if (donorType === 'teacher' && (!selectedTeacher || amount <= 0)) {
      toast.error('Select a teacher and enter a positive number of cans');
      return;
    }
    
    try {
      const payload = {
        admin_id: 1,
        amount,
      };
      
      if (donorType === 'student') {
        payload.student_id = selected.id;
      } else {
        payload.teacher_id = selectedTeacher.id;
      }
      
      await api.post(API_ENDPOINTS.EVENTS.DONATIONS('1'), payload);
      
      const donorName = donorType === 'student' ? selected.name : selectedTeacher.name;
      toast.success(`Recorded ${amount} cans for ${donorName}`);
      
      setAmount(0);
      setSelected(null);
      setSelectedTeacher(null);
      setQuery('');
    } catch (e) {
      toast.error('Failed to record donation. Person may not exist in database.');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Record Donations
      </Typography>
      
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Tabs value={donorType} onChange={(_, newValue) => setDonorType(newValue)} sx={{ mb: 3 }}>
          <Tab 
            icon={<Person />} 
            label="Student Donations" 
            value="student"
            iconPosition="start"
          />
          <Tab 
            icon={<School />} 
            label="Teacher Donations" 
            value="teacher"
            iconPosition="start"
          />
        </Tabs>
        
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          {donorType === 'student' ? (
            <Autocomplete
              sx={{ flex: 2, minWidth: 280 }}
              options={options}
              value={selected}
              getOptionLabel={(o) => o?.name || ''}
              onInputChange={(_, val) => searchStudents(val)}
              onChange={(_, val) => setSelected(val)}
              renderInput={(params) => <TextField {...params} label="Student" />}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {option.grade && <Chip label={`Grade ${option.grade}`} size="small" />}
                      {option.homeroomNumber && <Chip label={option.homeroomNumber} size="small" variant="outlined" />}
                    </Box>
                  </Box>
                </Box>
              )}
            />
          ) : (
            <Autocomplete
              sx={{ flex: 2, minWidth: 280 }}
              options={teacherOptions}
              value={selectedTeacher}
              getOptionLabel={(o) => o?.name || ''}
              onInputChange={(_, val) => searchTeachers(val)}
              onChange={(_, val) => setSelectedTeacher(val)}
              renderInput={(params) => <TextField {...params} label="Teacher" />}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    {option.homeroomNumber && (
                      <Chip label={option.homeroomNumber} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                    )}
                  </Box>
                </Box>
              )}
            />
          )}
          
          <TextField
            sx={{ width: 160 }}
            label="Cans"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            inputProps={{ min: 0 }}
          />
          <Button variant="contained" onClick={submit} sx={{ fontWeight: 700 }}>
            Record
          </Button>
        </Stack>
        
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          {donorType === 'student' 
            ? "This will increment the student's total and their class totals."
            : "This will increment the teacher's total and their homeroom total (if they have one)."
          }
        </Typography>
      </Paper>
    </Box>
  );
};

export default DonationManagement;


