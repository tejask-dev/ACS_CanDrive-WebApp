import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Container,
  Divider,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  EmojiEvents,
  Upload,
  Logout,
  Map,
  Event,
  FileDownload,
} from '@mui/icons-material';
import { toast } from 'sonner';

import EventManagement from '@/components/admin/EventManagement';
import StudentManagement from '@/components/admin/StudentManagement';
import DonationManagement from '@/components/admin/DonationManagement';
import LeaderboardView from '@/components/admin/LeaderboardView';
import MapView from '@/components/admin/MapView';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auth temporarily disabled for testing access to admin dashboard
  useEffect(() => {
    // no-op
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { id: 'events', label: 'Events', icon: <Event /> },
    { id: 'students', label: 'Students', icon: <People /> },
    { id: 'donations', label: 'Donations', icon: <Upload /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <EmojiEvents /> },
    { id: 'map', label: 'Map Reservations', icon: <Map /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return <EventManagement />;
      case 'students':
        return <StudentManagement />;
      case 'donations':
        return <DonationManagement />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'map':
        return <MapView />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ACS Can Drive - Admin Dashboard
          </Typography>
          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ fontWeight: 600 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            mt: 8,
          },
        }}
      >
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'hsl(217, 91%, 35%)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'hsl(217, 91%, 30%)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: activeTab === item.id ? 'white' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: drawerOpen ? 0 : '-240px',
          transition: 'margin-left 0.3s',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="xl">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

const DashboardOverview = () => (
  <Box>
    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
      Dashboard Overview
    </Typography>
    <Typography color="text.secondary" paragraph>
      Welcome to the ACS Can Drive Admin Dashboard. Select a section from the menu to get started.
    </Typography>
    
    {/* This would include stats cards, charts, etc. */}
    <Box
      sx={{
        mt: 4,
        p: 4,
        bgcolor: 'background.paper',
        borderRadius: 3,
        textAlign: 'center',
      }}
    >
      <EmojiEvents sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
        Quick Stats Coming Soon
      </Typography>
      <Typography color="text.secondary">
        View real-time statistics, charts, and insights here.
      </Typography>
    </Box>
  </Box>
);

export default AdminDashboard;
