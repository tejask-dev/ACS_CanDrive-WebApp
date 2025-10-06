import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Add, Edit, Delete, AttachMoney } from '@mui/icons-material';
import { toast } from 'sonner';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { Student } from '@/types';

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [editCansOpen, setEditCansOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    homeroomNumber: '',
    homeroomTeacher: '',
  });
  const [cansData, setCansData] = useState({
    totalCans: 0,
  });
  const [filters, setFilters] = useState({
    grade: '',
    homeroom: '',
    name: '',
    teacher: '',
  });

  useEffect(() => {
    loadStudents();
  }, [filters]);

  const loadStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.grade) params.append('grade', filters.grade);
      if (filters.homeroom) params.append('homeroom', filters.homeroom);
      if (filters.name) params.append('name', filters.name);
      if (filters.teacher) params.append('teacher', filters.teacher);
      
      const url = `${API_ENDPOINTS.EVENTS.STUDENTS('1')}?${params}`;
      console.log('🔍 Frontend Debug - Filters:', filters);
      console.log('🔍 Frontend Debug - URL:', url);
      console.log('🔍 Frontend Debug - Params string:', params.toString());
      
      const response = await api.get(url);
      console.log('Students API response:', response.data.slice(0, 3)); // Debug first 3 students
      setStudents(response.data);
    } catch (error) {
      console.error('❌ Frontend Error:', error);
      toast.error('Failed to load students');
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedStudent) {
        await api.put(
          API_ENDPOINTS.EVENTS.STUDENT_BY_ID('1', selectedStudent.id),
          formData
        );
        toast.success('Student updated successfully');
      } else {
        await api.post(API_ENDPOINTS.EVENTS.STUDENTS('1'), formData);
        toast.success('Student added successfully');
      }
      setOpen(false);
      loadStudents();
      resetForm();
    } catch (error) {
      toast.error('Failed to save student');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;

    try {
      await api.delete(API_ENDPOINTS.EVENTS.STUDENT_BY_ID('1', id));
      toast.success('Student deleted successfully');
      loadStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const handleEditCans = (student: Student) => {
    setSelectedStudent(student);
    setCansData({
      totalCans: student.totalCans || 0,
    });
    setEditCansOpen(true);
  };

  const handleUpdateCans = async () => {
    if (!selectedStudent) return;

    try {
      await api.put(
        API_ENDPOINTS.EVENTS.STUDENT_BY_ID('1', selectedStudent.id),
        { totalCans: cansData.totalCans }
      );
      toast.success('Student cans updated successfully');
      setEditCansOpen(false);
      loadStudents();
    } catch (error) {
      toast.error('Failed to update student cans');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '',
      homeroomNumber: '',
      homeroomTeacher: '',
    });
    setSelectedStudent(null);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'grade', headerName: 'Grade', width: 100 },
    { field: 'homeroomNumber', headerName: 'Homeroom', width: 120 },
    { field: 'homeroomTeacher', headerName: 'Teacher', flex: 1, minWidth: 150 },
    { field: 'totalCans', headerName: 'Total Cans', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedStudent(params.row);
              setFormData({
                name: params.row.name,
                grade: params.row.grade.toString(),
                homeroomNumber: params.row.homeroomNumber,
                homeroomTeacher: params.row.homeroomTeacher,
              });
              setOpen(true);
            }}
            title="Edit Student Info"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEditCans(params.row)}
            title="Edit Total Cans"
          >
            <AttachMoney />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
            title="Delete Student"
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Student Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          Add Student
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            label="Grade"
            value={filters.grade}
            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
            sx={{ width: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            {[9, 10, 11, 12].map((grade) => (
              <MenuItem key={grade} value={grade.toString()}>
                Grade {grade}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Homeroom"
            value={filters.homeroom}
            onChange={(e) => setFilters({ ...filters, homeroom: e.target.value })}
            sx={{ width: 200 }}
            placeholder="Filter by homeroom"
          />
          <TextField
            label="Student Name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            sx={{ width: 200 }}
            placeholder="Search by name"
          />
          <TextField
            label="Teacher"
            value={filters.teacher}
            onChange={(e) => setFilters({ ...filters, teacher: e.target.value })}
            sx={{ width: 200 }}
            placeholder="Filter by teacher"
          />
        </Box>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={students}
          columns={columns}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Grade"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              fullWidth
            >
              {[9, 10, 11, 12].map((grade) => (
                <MenuItem key={grade} value={grade.toString()}>
                  Grade {grade}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Homeroom Number"
              value={formData.homeroomNumber}
              onChange={(e) => setFormData({ ...formData, homeroomNumber: e.target.value })}
              fullWidth
            />
            <TextField
              label="Homeroom Teacher"
              value={formData.homeroomTeacher}
              onChange={(e) => setFormData({ ...formData, homeroomTeacher: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editCansOpen} onClose={() => setEditCansOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Total Cans - {selectedStudent?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Total Cans"
              type="number"
              value={cansData.totalCans}
              onChange={(e) => setCansData({ ...cansData, totalCans: Number(e.target.value) })}
              fullWidth
              inputProps={{ min: 0 }}
              helperText="Enter the total number of cans for this student"
            />
            <Typography variant="body2" color="text.secondary">
              Current total: {selectedStudent?.totalCans || 0} cans
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCansOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateCans} variant="contained" color="primary">
            Update Cans
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentManagement;
