import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { ArrowBack, EmojiEvents, School, Refresh, TrendingUp, CheckCircle } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { LeaderboardData, LeaderboardEntry, ClassBuyoutEntry } from '@/types';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardData>({
    topStudents: [],
    topTeachers: [],
    topClasses: [],
    topGrades: [],
    classBuyout: [],
    totalCans: 0,
  });

  useEffect(() => {
    loadLeaderboard();
    // Refresh every 30 seconds to get latest data
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      console.log('Loading leaderboard...');
      console.log('API URL:', API_ENDPOINTS.EVENTS.LEADERBOARD('1'));
      
      const response = await api.get(API_ENDPOINTS.EVENTS.LEADERBOARD('1'));
      console.log('Leaderboard response status:', response.status);
      console.log('Leaderboard data:', response.data);
      
      if (response.data) {
        console.log('Top students from API:', response.data.topStudents);
        console.log('Top classes from API:', response.data.topClasses);
        console.log('Top grades from API:', response.data.topGrades);
        
        setData(response.data);
        console.log('Data set successfully:', response.data);
      } else {
        console.warn('No data received from API');
        setData({ topStudents: [], topClasses: [], topGrades: [], totalCans: 0 });
      }
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Set empty data on errors
      setData({ topStudents: [], topClasses: [], topGrades: [], totalCans: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'hsl(43, 96%, 56%)'; // Gold
    if (rank === 2) return 'hsl(0, 0%, 75%)'; // Silver
    if (rank === 3) return 'hsl(25, 76%, 57%)'; // Bronze
    return 'hsl(217, 91%, 35%)'; // Blue
  };

  const renderTable = (entries: LeaderboardEntry[], showGrade: boolean = false, isGrades: boolean = false) => (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'hsl(217, 91%, 35%)' }}>
            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rank</TableCell>
            {isGrades ? (
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Grade</TableCell>
            ) : (
              <>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Name</TableCell>
                {showGrade && <TableCell sx={{ color: 'white', fontWeight: 700 }}>Grade</TableCell>}
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Homeroom</TableCell>
              </>
            )}
            <TableCell sx={{ color: 'white', fontWeight: 700 }} align="right">Cans</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow
              key={index}
              component={motion.tr}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              sx={{
                '&:hover': { bgcolor: 'hsl(210, 20%, 95%)' },
              }}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {entry.rank <= 3 && (
                    <EmojiEvents sx={{ color: getRankColor(entry.rank) }} />
                  )}
                  <Typography
                    sx={{
                      fontWeight: entry.rank <= 3 ? 700 : 600,
                      color: getRankColor(entry.rank),
                    }}
                  >
                    #{entry.rank}
                  </Typography>
                </Box>
              </TableCell>
              {isGrades ? (
                <TableCell sx={{ fontWeight: 600 }}>Grade {entry.grade}</TableCell>
              ) : (
                <>
                  <TableCell sx={{ fontWeight: 600 }}>{entry.name}</TableCell>
                  {showGrade && <TableCell>{entry.grade}</TableCell>}
                  <TableCell>{entry.homeroomNumber}</TableCell>
                </>
              )}
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {entry.totalCans.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderClassBuyoutTable = (entries: ClassBuyoutEntry[]) => (
    <Box>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.light', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'info.dark' }}>
          🎯 Class Buyout Eligibility
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • Classes need to donate <strong>10 cans per student</strong> to be eligible
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • Only the <strong>first 20 classes</strong> to reach their target get the buyout
        </Typography>
        <Typography variant="body2">
          • Classes with 0 students are excluded
        </Typography>
      </Paper>
      
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'hsl(142, 76%, 36%)' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Class</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Students</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Required</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actual</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Progress</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'hsl(214, 20%, 95%)' } }}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {entry.homeroom_teacher}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Room {entry.homeroom_number}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {entry.student_count}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {entry.required_cans}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {entry.actual_cans}
                </TableCell>
                <TableCell sx={{ minWidth: 200 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'hsl(214, 20%, 88%)', borderRadius: 4, overflow: 'hidden' }}>
                      <Box 
                        sx={{ 
                          height: '100%', 
                          width: `${Math.min(100, entry.progress_percentage)}%`,
                          bgcolor: entry.is_eligible ? 'hsl(142, 76%, 36%)' : 'hsl(45, 93%, 47%)',
                          transition: 'width 0.3s ease'
                        }} 
                      />
                    </Box>
                    <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
                      {Math.round(entry.progress_percentage)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: entry.is_eligible ? 'hsl(142, 76%, 36%)' : 'hsl(0, 0%, 50%)', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: entry.is_eligible ? 'hsl(142, 76%, 36%)' : 'hsl(0, 0%, 50%)' }}>
                      {entry.is_eligible ? 'Eligible' : 'Not Eligible'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {entries.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No eligible classes yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Classes need to reach their target to appear here
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const chartData = data.topStudents.slice(0, 10).map((entry) => ({
    name: entry.name.split(' ')[0], // First name only
    cans: entry.totalCans,
  }));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ACS Can Drive - Leaderboard
          </Typography>
          <IconButton color="inherit" onClick={loadLeaderboard} disabled={loading} title="Refresh Leaderboard">
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Refresh Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  console.log('Current data state:', data);
                  console.log('Loading state:', loading);
                }}
                sx={{ color: 'hsl(217, 91%, 35%)', borderColor: 'hsl(217, 91%, 35%)' }}
              >
                Debug Data
              </Button>
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:8000/api/events/1/leaderboard');
                    console.log('Direct fetch response:', response.status);
                    const data = await response.json();
                    console.log('Direct fetch data:', data);
                  } catch (error) {
                    console.error('Direct fetch error:', error);
                  }
                }}
                sx={{ color: 'hsl(142, 76%, 36%)', borderColor: 'hsl(142, 76%, 36%)' }}
              >
                Test API
              </Button>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={loadLeaderboard}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, hsl(217, 91%, 25%) 0%, hsl(217, 91%, 45%) 100%)',
                  }
                }}
              >
                Refresh Data
              </Button>
            </Box>

            {/* Stats Cards */}
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
                gap: 3, 
                mb: 4 
              }}
            >
              <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring' }}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Cans Collected
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {data.totalCans.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring' }}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, hsl(43, 96%, 56%) 0%, hsl(38, 100%, 50%) 100%)',
                    color: 'hsl(217, 33%, 17%)',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Top Student
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {data.topStudents[0]?.name || 'N/A'}
                    </Typography>
                    <Typography variant="h6">
                      {data.topStudents[0]?.totalCans.toLocaleString() || 0} cans
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring' }}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 76%, 46%) 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Top Class
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {data.topClasses[0]?.name || 'N/A'}
                    </Typography>
                    <Typography variant="h6">
                      {data.topClasses[0]?.totalCans.toLocaleString() || 0} cans
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>

            {/* Chart */}
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                Top 10 Students
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cans" radius={[8, 8, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={getRankColor(index + 1)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>

            {/* Tabs */}
            <Paper elevation={3} sx={{ borderRadius: 3 }}>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root': { fontWeight: 600 },
                }}
              >
                <Tab icon={<EmojiEvents />} label="Top Students" iconPosition="start" />
                <Tab icon={<School />} label="Top Teachers" iconPosition="start" />
                <Tab icon={<School />} label="Top Classes" iconPosition="start" />
                <Tab icon={<TrendingUp />} label="Top Grades" iconPosition="start" />
                <Tab icon={<CheckCircle />} label="Class Buyout" iconPosition="start" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {tabValue === 0 && renderTable(data.topStudents, true)}
                {tabValue === 1 && renderTable(data.topTeachers || [], false)}
                {tabValue === 2 && renderTable(data.topClasses)}
                {tabValue === 3 && renderTable(data.topGrades, false, true)}
                {tabValue === 4 && renderClassBuyoutTable(data.classBuyout || [])}
              </Box>
            </Paper>
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default Leaderboard;
