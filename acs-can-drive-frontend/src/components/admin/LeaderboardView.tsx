import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { FileDownload, Refresh } from '@mui/icons-material';
import { toast } from 'sonner';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { LeaderboardData } from '@/types';

const LeaderboardView = () => {
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState<LeaderboardData | null>(null);

  useEffect(() => {
    loadLeaderboard();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLeaderboard = async () => {
    try {
      console.log('Loading admin leaderboard...');
      console.log('API URL:', API_ENDPOINTS.EVENTS.LEADERBOARD('1'));
      
      const response = await api.get(API_ENDPOINTS.EVENTS.LEADERBOARD('1'));
      console.log('Admin leaderboard response:', response.data);
      console.log('Top students:', response.data.topStudents);
      console.log('Top classes:', response.data.topClasses);
      console.log('Top grades:', response.data.topGrades);
      console.log('Total cans:', response.data.totalCans);
      
      if (response.data) {
        setData(response.data);
        console.log('Admin leaderboard data set:', response.data);
      } else {
        console.warn('No data received from admin leaderboard API');
        setData({ topStudents: [], topClasses: [], topGrades: [], totalCans: 0 });
      }
    } catch (error: any) {
      console.error('Failed to load admin leaderboard:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      toast.error('Failed to load leaderboard');
      setData({ topStudents: [], topClasses: [], topGrades: [], totalCans: 0 });
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'hsl(43, 96%, 56%)'; // Gold
    if (rank === 2) return 'hsl(0, 0%, 75%)'; // Silver
    if (rank === 3) return 'hsl(25, 76%, 57%)'; // Bronze
    return 'hsl(217, 91%, 35%)'; // Blue
  };

  const renderTable = (entries: any[], showGrade: boolean = false, isGrades: boolean = false) => (
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
              sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: getRankColor(entry.rank),
                    }}
                  >
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
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

  const handleExport = async (format: string) => {
    try {
      if (format === 'csv') {
        // Create CSV content
        let csvContent = '';
        
        if (!data) {
          toast.error('No data available to export');
          return;
        }

        if (tabValue === 0) {
          // Top Students
          csvContent = 'Rank,Name,Grade,Homeroom,Cans\n';
          data.topStudents.forEach(student => {
            csvContent += `${student.rank},"${student.name}",${student.grade},"${student.homeroomNumber}",${student.totalCans}\n`;
          });
        } else if (tabValue === 1) {
          // Top Classes
          csvContent = 'Rank,Class Name,Homeroom,Cans\n';
          data.topClasses.forEach(cls => {
            csvContent += `${cls.rank},"${cls.name}","${cls.homeroomNumber}",${cls.totalCans}\n`;
          });
        } else if (tabValue === 2) {
          // Top Grades
          csvContent = 'Rank,Grade,Cans\n';
          data.topGrades.forEach(grade => {
            csvContent += `${grade.rank},"Grade ${grade.grade}",${grade.totalCans}\n`;
          });
        }
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `leaderboard_${format === 'csv' ? 'students' : tabValue === 1 ? 'classes' : 'grades'}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('CSV exported successfully');
      } else {
        toast.error('Only CSV export is currently supported');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Leaderboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={loadLeaderboard}
            sx={{
              background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, hsl(217, 91%, 25%) 0%, hsl(217, 91%, 45%) 100%)',
              }
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => handleExport('xlsx')}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {data && (
        <Paper>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Top Students (${data.topStudents.length})`} />
            <Tab label={`Top Teachers (${data.topTeachers?.length || 0})`} />
            <Tab label={`Top Classes (${data.topClasses.length})`} />
            <Tab label={`Top Grades (${data.topGrades.length})`} />
          </Tabs>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Total Cans Collected: {data.totalCans.toLocaleString()}
            </Typography>
            
            {tabValue === 0 && renderTable(data.topStudents, true)}
            {tabValue === 1 && renderTable(data.topTeachers || [], false)}
            {tabValue === 2 && renderTable(data.topClasses)}
            {tabValue === 3 && renderTable(data.topGrades, false, true)}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default LeaderboardView;
