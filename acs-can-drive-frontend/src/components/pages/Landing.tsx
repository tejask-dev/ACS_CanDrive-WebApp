import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Stack, Card, CardContent, Button as MUIButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { PersonAdd, Map, TrendingUp, EmojiEvents, Lock } from '@mui/icons-material';
// import AcsCanLogo from '@/assets/acs-can-logo.svg';
// import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import DailyDonors from './DailyDonors';

const Landing = () => {
  const navigate = useNavigate();

  // Password protection state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Password protection functions
  const handleViewLeaderboard = () => {
    setPasswordDialogOpen(true);
    setPassword('');
    setPasswordError('');
  };

  const handlePasswordSubmit = () => {
    if (password === 'Assumption_raiders') {
      setPasswordDialogOpen(false);
      setPassword('');
      setPasswordError('');
      
      // Trigger confetti animation
      triggerConfetti();
      
      // Navigate to leaderboard after a short delay
      setTimeout(() => {
        navigate('/leaderboard');
      }, 1000);
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const triggerConfetti = () => {
    // Simple confetti effect using CSS animations
    const confettiElement = document.createElement('div');
    confettiElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    
    // Create multiple confetti pieces
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][Math.floor(Math.random() * 6)]};
        left: ${Math.random() * 100}%;
        top: -10px;
        animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
      `;
      confettiElement.appendChild(piece);
    }
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confetti-fall {
        to {
          transform: translateY(100vh) rotate(720deg);
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(confettiElement);
    
    // Remove after animation
    setTimeout(() => {
      document.body.removeChild(confettiElement);
      document.head.removeChild(style);
    }, 5000);
  };

  const features = [
    {
      icon: <PersonAdd sx={{ fontSize: 40 }} />,
      title: 'Join the Drive',
      description: 'Sign up and reserve your collection streets',
    },
    {
      icon: <Map sx={{ fontSize: 40 }} />,
      title: 'Reserve Streets',
      description: 'Claim streets on our interactive map',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Track Progress',
      description: 'See real-time donation counts',
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 40 }} />,
      title: 'Win Prizes',
      description: 'Compete for top spots and amazing awards',
    },
  ];

  const prizes = [
    {
      title: '1st Place',
      prize: 'Prizes soon to come...',
      description: 'Top individual collector',
      emoji: '🥇',
    },
    {
      title: '2nd Place',
      prize: 'Prizes soon to come...',
      description: 'Second highest collector',
      emoji: '🥈',
    },
    {
      title: '3rd Place',
      prize: 'Prizes soon to come...',
      description: 'Third highest collector',
      emoji: '🥉',
    },
    {
      title: 'Top Class',
      prize: 'Prizes soon to come...',
      description: 'Highest class average',
      emoji: '🍕',
    },
    {
      title: 'Top Grade',
      prize: 'Prizes soon to come...',
      description: 'Highest grade total',
      emoji: '🎉',
    },
    {
      title: 'Early Bird',
      prize: 'Prizes soon to come...',
      description: 'First 50 cans collected',
      emoji: '🐦',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, hsl(270, 60%, 50%) 0%, hsl(270, 60%, 65%) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <motion.div
        style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '5%',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Box sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 800,
                color: 'white',
                mb: 2,
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              ACS Can Drive
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.5rem' },
                color: 'rgba(255,255,255,0.95)',
                mb: 1,
                fontWeight: 500,
              }}
            >
              Assumption College School
            </Typography>

            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', md: '1.25rem' },
                color: 'rgba(255,255,255,0.85)',
                mb: 6,
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              Together we're making a difference, one can at a time
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 8 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <MUIButton
                  onClick={() => navigate('/signup')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontWeight: 800,
                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                    borderRadius: 3,
                    color: '#fff',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    background: 'linear-gradient(135deg, hsl(270, 60%, 55%) 0%, hsl(270, 60%, 45%) 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, hsl(270, 60%, 60%) 0%, hsl(270, 60%, 50%) 100%)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  Student Street Signup
                </MUIButton>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <MUIButton
                  onClick={() => navigate('/teacher-signup')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontWeight: 800,
                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                    borderRadius: 3,
                    color: '#fff',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    background: 'linear-gradient(135deg, hsl(200, 60%, 55%) 0%, hsl(200, 60%, 45%) 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, hsl(200, 60%, 60%) 0%, hsl(200, 60%, 50%) 100%)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  Teacher Street Signup
                </MUIButton>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <MUIButton
                  onClick={handleViewLeaderboard}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontWeight: 800,
                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                    borderRadius: 3,
                    color: '#fff',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, hsl(217, 91%, 25%) 0%, hsl(217, 91%, 45%) 100%)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <Lock sx={{ mr: 1, fontSize: '1.1rem' }} />
                  View Leaderboard
                </MUIButton>
              </motion.div>
            </Stack>
          </motion.div>

          {/* Features Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 3,
              mt: 8,
              mb: 10,
            }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    p: 3,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.2)',
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <Box sx={{ color: 'white', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ color: 'white', fontWeight: 700, mb: 1 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                    {feature.description}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>

          {/* Prizes Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Box sx={{ mb: 10 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 800,
                  color: 'white',
                  mb: 2,
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                🏆 Amazing Prizes 🏆
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '1rem', md: '1.2rem' },
                  color: 'rgba(255,255,255,0.9)',
                  mb: 5,
                }}
              >
                Compete for incredible rewards and recognition!
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
                  gap: 3,
                }}
              >
                {prizes.map((prize, index) => (
                  <motion.div
                    key={prize.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Card
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 4,
                        height: '100%',
                        border: '2px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                        },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        <Typography
                          sx={{
                            fontSize: '3rem',
                            mb: 2,
                          }}
                        >
                          {prize.emoji}
                        </Typography>
                        <Badge className="mb-2 bg-primary text-white">
                          {prize.title}
                        </Badge>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: 'hsl(270, 60%, 50%)',
                            mb: 1,
                          }}
                        >
                          {prize.prize}
                        </Typography>
                        <Typography
                          sx={{
                            color: 'hsl(240, 6%, 40%)',
                            fontSize: '0.9rem',
                          }}
                        >
                          {prize.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            </Box>
          </motion.div>

          {/* Leaderboard Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Box sx={{ mb: 8 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 800,
                  color: 'white',
                  mb: 2,
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                🌟 Leaderboard 🌟
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 5 }}>
                <Typography
                  sx={{
                    fontSize: { xs: '1rem', md: '1.2rem' },
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  See who's leading the charge in our can drive!
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 4,
                }}
              >
                {/* Top Students */}
                <Card
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: 'hsl(270, 60%, 50%)',
                        mb: 3,
                        textAlign: 'center',
                      }}
                    >
                      Top Students
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        bgcolor: 'hsl(270, 60%, 97%)',
                        borderRadius: 2,
                        border: '2px solid hsl(270, 60%, 85%)',
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: 'hsl(270, 60%, 50%)',
                          textAlign: 'center',
                        }}
                      >
                        🎉 FINAL numbers will be revealed at the assembly! 🎉
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Top Classes */}
                <Card
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: 'hsl(270, 60%, 50%)',
                        mb: 3,
                        textAlign: 'center',
                      }}
                    >
                      Top Classes
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        bgcolor: 'hsl(270, 60%, 97%)',
                        borderRadius: 2,
                        border: '2px solid hsl(270, 60%, 85%)',
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: 'hsl(270, 60%, 50%)',
                          textAlign: 'center',
                        }}
                      >
                        🎉 FINAL numbers will be revealed at the assembly! 🎉
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Top Grades */}
                <Card
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: 'hsl(270, 60%, 50%)',
                        mb: 3,
                        textAlign: 'center',
                      }}
                    >
                      Top Grades
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        bgcolor: 'hsl(270, 60%, 97%)',
                        borderRadius: 2,
                        border: '2px solid hsl(270, 60%, 85%)',
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: 'hsl(270, 60%, 50%)',
                          textAlign: 'center',
                        }}
                      >
                        🎉 FINAL numbers will be revealed at the assembly! 🎉
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Class Buyout */}
                <Card
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: 'hsl(142, 76%, 36%)',
                        mb: 3,
                        textAlign: 'center',
                      }}
                    >
                      🎯 Class Buyout
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        bgcolor: 'hsl(142, 76%, 97%)',
                        borderRadius: 2,
                        border: '2px solid hsl(142, 76%, 85%)',
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: 'hsl(142, 76%, 36%)',
                          textAlign: 'center',
                        }}
                      >
                        🎉 FINAL numbers will be revealed at the assembly! 🎉
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </motion.div>

          {/* Daily Donors Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Box sx={{ mt: 6, mb: 4 }}>
              <DailyDonors />
            </Box>
          </motion.div>

          {/* Admin Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <MUIButton
              onClick={() => navigate('/admin/login')}
              sx={{
                mt: 2,
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                },
              }}
            >
              Admin Login
            </MUIButton>
          </motion.div>
        </Box>
      </Container>

      {/* Password Dialog */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', color: 'hsl(270, 60%, 50%)', fontWeight: 700 }}>
          🔒 Enter Password to View Leaderboard
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ textAlign: 'center', mb: 2, color: 'hsl(240, 6%, 25%)' }}>
            Numbers to be revealed at the assembly!
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!passwordError}
            helperText={passwordError}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handlePasswordSubmit();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'hsl(270, 60%, 50%)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'hsl(270, 60%, 50%)',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <MUIButton
            onClick={() => setPasswordDialogOpen(false)}
            sx={{
              color: 'hsl(240, 6%, 46%)',
              mr: 2,
            }}
          >
            Cancel
          </MUIButton>
          <MUIButton
            onClick={handlePasswordSubmit}
            sx={{
              px: 4,
              py: 1,
              fontWeight: 700,
              borderRadius: 2,
              color: '#fff',
              background: 'linear-gradient(135deg, hsl(270, 60%, 50%) 0%, hsl(270, 60%, 40%) 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, hsl(270, 60%, 60%) 0%, hsl(270, 60%, 50%) 100%)',
              }
            }}
          >
            Enter
          </MUIButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Landing;
