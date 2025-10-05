import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { Refresh, EmojiEvents, School } from '@mui/icons-material';
import { API_BASE_URL, API_ENDPOINTS } from '@/components/config/api';

interface DailyDonor {
  id: number;
  name: string;
  dailyCans: number;
  rank: number;
  grade?: string;
  homeroomNumber?: string;
}

interface DailyDonorsData {
  date: string;
  topStudents: DailyDonor[];
  topTeachers: DailyDonor[];
}

const DailyDonors = () => {
  const [data, setData] = useState<DailyDonorsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyDonors();
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(loadDailyDonors, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadDailyDonors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EVENTS.DAILY_DONORS('1')}`);
      if (response.ok) {
        const data = await response.json();
        setData(data);
      } else {
        console.error('Failed to load daily donors');
      }
    } catch (error) {
      console.error('Error loading daily donors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#1976d2'; // Blue
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
            🏆 Top Donors of the Day
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            {data ? formatDate(data.date) : 'Loading...'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDailyDonors}
            sx={{ mb: 3 }}
          >
            Refresh
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4 }}>
          {/* Top Students */}
          <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ 
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', 
              color: 'white', 
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <EmojiEvents />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Top Students Today
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Grade</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Cans Today</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.topStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Alert severity="info">No student donations today</Alert>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.topStudents.map((student) => (
                      <TableRow key={student.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                color: getRankColor(student.rank),
                              }}
                            >
                              {getRankIcon(student.rank)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {student.name}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={student.grade || 'N/A'} 
                            color="primary" 
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1976d2' }}>
                          {student.dailyCans} cans
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Top Teachers */}
          <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ 
              background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)', 
              color: 'white', 
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <School />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Top Teachers Today
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Homeroom</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Cans Today</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.topTeachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Alert severity="info">No teacher donations today</Alert>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.topTeachers.map((teacher) => (
                      <TableRow key={teacher.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                color: getRankColor(teacher.rank),
                              }}
                            >
                              {getRankIcon(teacher.rank)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {teacher.name}
                        </TableCell>
                        <TableCell>
                          {teacher.homeroomNumber ? (
                            <Chip 
                              label={teacher.homeroomNumber} 
                              color="success" 
                              variant="outlined"
                              size="small"
                            />
                          ) : (
                            <Typography color="textSecondary">No homeroom</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                          {teacher.dailyCans} cans
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </motion.div>
    </Container>
  );
};

export default DailyDonors;
