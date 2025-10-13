import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Button,
  IconButton,
} from '@mui/material';
import { CheckCircle, Cancel, Refresh } from '@mui/icons-material';
import { toast } from 'sonner';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

interface ClassBuyoutData {
  class_name: string;
  homeroom_teacher: string;
  homeroom_number: string;
  student_count: number;
  required_cans: number;
  actual_cans: number;
  is_eligible: boolean;
  progress_percentage: number;
}

const ClassBuyoutView = () => {
  const [data, setData] = useState<ClassBuyoutData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassBuyoutData();
  }, []);

  const loadClassBuyoutData = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.EVENTS.LEADERBOARD('1'));
      
      if (response.data && response.data.allClassBuyout) {
        setData(response.data.allClassBuyout);
      } else {
        console.warn('No class buyout data received');
        setData([]);
      }
    } catch (error: any) {
      console.error('Failed to load class buyout data:', error);
      toast.error('Failed to load class buyout data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getEligibilityChip = (isEligible: boolean) => {
    return (
      <Chip
        icon={isEligible ? <CheckCircle /> : <Cancel />}
        label={isEligible ? 'Eligible' : 'Not Eligible'}
        color={isEligible ? 'success' : 'error'}
        variant={isEligible ? 'filled' : 'outlined'}
        size="small"
      />
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography>Loading class buyout data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Class Buyout Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadClassBuyoutData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.light', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'info.dark' }}>
          🎯 Class Buyout Rules
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • Each class must donate <strong>10 cans per student</strong> to be eligible for buyout
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • Only classes with both homeroom teacher and number are included
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • Classes with 0 students are excluded
        </Typography>
        <Typography variant="body2">
          • The <strong>first 20 classes</strong> to reach their target will receive the buyout
        </Typography>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Students</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Required Cans</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actual Cans</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((classData, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {classData.homeroom_teacher}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Room {classData.homeroom_number}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {classData.student_count}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {classData.required_cans}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {classData.actual_cans}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={classData.progress_percentage}
                        color={getProgressColor(classData.progress_percentage)}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
                        {Math.round(classData.progress_percentage)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getEligibilityChip(classData.is_eligible)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {data.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No class data available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Make sure students have homeroom teachers and numbers assigned
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ClassBuyoutView;
