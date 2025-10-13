import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Stack, Card, CardContent, Button as MUIButton } from '@mui/material';
import { PersonAdd, Map, TrendingUp, EmojiEvents, Refresh } from '@mui/icons-material';
// import AcsCanLogo from '@/assets/acs-can-logo.svg';
// import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import { Badge } from '@/components/ui/badge';
import DailyDonors from './DailyDonors';

const Landing = () => {
  const navigate = useNavigate();

  // Fetch leaderboard data
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    try {
      console.log('Fetching leaderboard data for landing page...');
      const response = await api.get(API_ENDPOINTS.EVENTS.LEADERBOARD('1'));
      console.log('Landing page leaderboard response:', response.data);
      console.log('Top students from API:', response.data.topStudents);
      setLeaderboardData(response.data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      // Set empty data on error
      setLeaderboardData({
        topStudents: [],
        topClasses: [],
        topGrades: [],
        totalCans: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadLeaderboard, 10000);
    
    return () => clearInterval(interval);
  }, []);

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
                  onClick={() => navigate('/leaderboard')}
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
                <MUIButton
                  onClick={() => loadLeaderboard()}
                  sx={{
                    minWidth: 'auto',
                    p: 1,
                    color: 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                    }
                  }}
                  title="Refresh Leaderboard"
                >
                  <Refresh />
                </MUIButton>
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
                    {loading ? (
                      <Typography sx={{ textAlign: 'center', color: 'hsl(240, 4%, 46%)' }}>
                        Loading...
                      </Typography>
                    ) : leaderboardData?.topStudents?.slice(0, 5).map((student: any, index: number) => {
                      console.log(`Rendering student ${index + 1}:`, student);
                      return (
                      <Box
                        key={student.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          mb: 2,
                          bgcolor: index < 3 ? 'hsl(270, 60%, 97%)' : 'hsl(240, 5%, 98%)',
                          borderRadius: 2,
                          border: index < 3 ? '2px solid hsl(270, 60%, 85%)' : '1px solid hsl(240, 6%, 90%)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography
                            sx={{
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              color: index === 0 ? 'hsl(270, 60%, 50%)' : 'hsl(240, 6%, 50%)',
                            }}
                          >
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </Typography>
                          <Typography sx={{ fontWeight: 600, color: 'hsl(240, 6%, 25%)' }}>
                            {student.name}
                          </Typography>
                        </Box>
                        <Badge className="bg-primary text-white">
                          {student.totalCans || 0} cans
                        </Badge>
                      </Box>
                      );
                    }) || (
                      <Typography sx={{ textAlign: 'center', color: 'hsl(240, 4%, 46%)' }}>
                        No data yet
                      </Typography>
                    )}
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
                    {loading ? (
                      <Typography sx={{ textAlign: 'center', color: 'hsl(240, 4%, 46%)' }}>
                        Loading...
                      </Typography>
                    ) : leaderboardData?.topClasses?.slice(0, 5).map((cls: any, index: number) => (
                      <Box
                        key={cls.homeroom}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          mb: 2,
                          bgcolor: index < 3 ? 'hsl(270, 60%, 97%)' : 'hsl(240, 5%, 98%)',
                          borderRadius: 2,
                          border: index < 3 ? '2px solid hsl(270, 60%, 85%)' : '1px solid hsl(240, 6%, 90%)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography
                            sx={{
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              color: index === 0 ? 'hsl(270, 60%, 50%)' : 'hsl(240, 6%, 50%)',
                            }}
                          >
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </Typography>
                          <Typography sx={{ fontWeight: 600, color: 'hsl(240, 6%, 25%)' }}>
                            {cls.name || cls.homeroom}
                          </Typography>
                        </Box>
                        <Badge className="bg-secondary text-white">
                          {cls.totalCans || 0} cans
                        </Badge>
                      </Box>
                    )) || (
                      <Typography sx={{ textAlign: 'center', color: 'hsl(240, 4%, 46%)' }}>
                        No data yet
                      </Typography>
                    )}
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
                    {loading ? (
                      <Typography sx={{ textAlign: 'center', color: 'hsl(240, 4%, 46%)' }}>
                        Loading...
                      </Typography>
                    ) : leaderboardData?.topGrades?.slice(0, 5).map((grade: any, index: number) => (
                      <Box
                        key={grade.grade}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          mb: 2,
                          bgcolor: index < 3 ? 'hsl(270, 60%, 97%)' : 'hsl(240, 5%, 98%)',
                          borderRadius: 2,
                          border: index < 3 ? '2px solid hsl(270, 60%, 85%)' : '1px solid hsl(240, 6%, 90%)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography
                            sx={{
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              color: index === 0 ? 'hsl(270, 60%, 50%)' : 'hsl(240, 6%, 50%)',
                            }}
                          >
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </Typography>
                          <Typography sx={{ fontWeight: 600, color: 'hsl(240, 6%, 25%)' }}>
                            Grade {grade.grade}
                          </Typography>
                        </Box>
                        <Badge className="bg-accent text-white">
                          {grade.totalCans || 0} cans
                        </Badge>
                      </Box>
                    )) || (
                      <Typography sx={{ textAlign: 'center', color: 'hsl(240, 4%, 46%)' }}>
                        No data yet
                      </Typography>
                    )}
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
                    {loading ? (
                      <Typography sx={{ textAlign: 'center', color: 'hsl(240, 4%, 46%)' }}>
                        Loading...
                      </Typography>
                    ) : leaderboardData?.classBuyout?.slice(0, 5).map((classData: any, index: number) => (
                      <Box
                        key={classData.class_name}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          mb: 2,
                          bgcolor: classData.is_eligible ? 'hsl(142, 76%, 97%)' : 'hsl(240, 5%, 98%)',
                          borderRadius: 2,
                          border: classData.is_eligible ? '2px solid hsl(142, 76%, 85%)' : '1px solid hsl(240, 6%, 90%)',
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: 'hsl(240, 6%, 25%)' }}>
                            {classData.homeroom_teacher}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'hsl(240, 4%, 46%)' }}>
                            Room {classData.homeroom_number}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Badge className={classData.is_eligible ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}>
                            {classData.is_eligible ? '✓ Eligible' : `${Math.round(classData.progress_percentage)}%`}
                          </Badge>
                          <Typography variant="caption" sx={{ display: 'block', color: 'hsl(240, 4%, 46%)', mt: 0.5 }}>
                            {classData.actual_cans}/{classData.required_cans} cans
                          </Typography>
                        </Box>
                      </Box>
                    )) || (
                      <Typography sx={{ textAlign: 'center', color: 'hsl(240, 4%, 46%)' }}>
                        No eligible classes yet
                      </Typography>
                    )}
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
    </Box>
  );
};

export default Landing;
