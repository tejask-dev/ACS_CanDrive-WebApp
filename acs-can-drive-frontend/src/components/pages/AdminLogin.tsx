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
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack, AdminPanelSettings } from '@mui/icons-material';
import { toast } from 'sonner';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, formData);
      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('authToken', token);
      }
      toast.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Invalid credentials. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <IconButton
        onClick={() => navigate('/')}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: 'white',
          bgcolor: 'rgba(255,255,255,0.1)',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.2)',
          },
        }}
      >
        <ArrowBack />
      </IconButton>

      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 5,
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <AdminPanelSettings
                  sx={{
                    fontSize: 60,
                    color: 'primary.main',
                    mb: 2,
                  }}
                />
              </motion.div>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                Admin Login
              </Typography>
              <Typography color="text.secondary">
                ACS Can Drive Dashboard
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  autoFocus
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || !formData.username || !formData.password}
                  sx={{
                    background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    mt: 2,
                  }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </Box>
            </form>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default AdminLogin;
