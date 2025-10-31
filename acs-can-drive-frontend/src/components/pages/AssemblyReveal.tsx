import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import { EmojiEvents, Star, TrendingUp } from '@mui/icons-material';

const AssemblyReveal = () => {
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0); // 0: class, 1: donors, 2: total
  const [totalCans, setTotalCans] = useState(0);
  const [targetTotalCans, setTargetTotalCans] = useState(0);
  
  // Refs for scrolling to each section
  const classSectionRef = useRef<HTMLDivElement>(null);
  const donorsSectionRef = useRef<HTMLDivElement>(null);
  const totalSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLeaderboardData();
    // Initial confetti will be triggered when top class appears (currentStep === 0)
  }, []);

  const loadLeaderboardData = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.LEADERBOARD('1'));
      setLeaderboardData(response.data);
      
      // Use the totalCans from API response (already calculated correctly on backend)
      const total = response.data.totalCans || 0;
      setTargetTotalCans(total);
      
      setLoading(false);
      
      // Start animation sequence: class (immediate) -> donors (10s) -> total (20s)
      setTimeout(() => {
        setCurrentStep(1); // Show donors after 10s
      }, 10000);
      
      setTimeout(() => {
        setCurrentStep(2); // Show total after 20s (10s after donors)
      }, 20000);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLoading(false);
    }
  };

  // Scroll to top class section when it first appears and trigger confetti
  useEffect(() => {
    const topClassData = leaderboardData?.topClasses?.[0];
    if (currentStep === 0 && topClassData) {
      setTimeout(() => {
        classSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      // Trigger confetti for top class reveal
      triggerConfetti();
    }
  }, [currentStep, leaderboardData]);

  // Scroll to donors section when it appears and trigger confetti
  useEffect(() => {
    if (currentStep === 1) {
      setTimeout(() => {
        donorsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      // Trigger confetti for top students reveal
      triggerConfetti();
    }
  }, [currentStep]);

  // Scroll to total section when it appears and trigger confetti
  useEffect(() => {
    if (currentStep === 2) {
      // Trigger confetti for total cans reveal
      triggerConfetti();
      setTimeout(() => {
        // Use window.scrollTo to ensure it scrolls down, not up
        if (totalSectionRef.current) {
          const rect = totalSectionRef.current.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          window.scrollTo({ 
            top: scrollTop + rect.top - 100, 
            behavior: 'smooth' 
          });
        }
      }, 300);
    }
  }, [currentStep]);

  // Count up animation for total cans - starts when currentStep >= 2 (Total Cans section appears)
  useEffect(() => {
    if (targetTotalCans > 0 && currentStep >= 2) {
      // Reset to 0 when section appears
      setTotalCans(0);
      
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = targetTotalCans / steps;
      const stepTime = duration / steps;
      
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= targetTotalCans) {
          setTotalCans(targetTotalCans);
          clearInterval(timer);
        } else {
          setTotalCans(Math.floor(current));
        }
      }, stepTime);
      
      return () => clearInterval(timer);
    }
  }, [targetTotalCans, currentStep]);

  const triggerConfetti = () => {
    // Create massive confetti effect
    for (let burst = 0; burst < 5; burst++) {
      setTimeout(() => {
        createConfettiBurst();
      }, burst * 500);
    }
    
    // Continuous confetti
    const continuousInterval = setInterval(() => {
      createConfettiPiece();
    }, 200);
    
    // Stop after 10 seconds
    setTimeout(() => clearInterval(continuousInterval), 10000);
  };

  const createConfettiBurst = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#ffd93d', '#6bcf7f'];
    const confettiContainer = document.createElement('div');
    confettiContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    
    // Create burst of confetti
    for (let i = 0; i < 100; i++) {
      const piece = document.createElement('div');
      const size = Math.random() * 10 + 5;
      const startX = Math.random() * window.innerWidth;
      const startY = -10;
      const rotation = Math.random() * 360;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      piece.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${startX}px;
        top: ${startY}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation: confetti-fall-${i} ${2 + Math.random() * 3}s ease-out forwards;
      `;
      
      const keyframes = `
        @keyframes confetti-fall-${i} {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(${window.innerHeight + 100}px) rotate(${rotation + 720}deg) scale(0);
            opacity: 0;
          }
        }
      `;
      
      const style = document.createElement('style');
      style.textContent = keyframes;
      document.head.appendChild(style);
      
      confettiContainer.appendChild(piece);
    }
    
    document.body.appendChild(confettiContainer);
    
    setTimeout(() => {
      document.body.removeChild(confettiContainer);
    }, 5000);
  };

  const createConfettiPiece = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const piece = document.createElement('div');
    piece.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%;
      top: -10px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9998;
      animation: confetti-slow 5s linear forwards;
    `;
    
    document.body.appendChild(piece);
    
    setTimeout(() => {
      if (piece.parentNode) {
        piece.parentNode.removeChild(piece);
      }
    }, 5000);
  };

  const topStudents = leaderboardData?.topStudents?.slice(0, 3) || [];
  const topClass = leaderboardData?.topClasses?.[0] || null;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h2" sx={{ color: 'white', fontWeight: 800 }}>
            Loading Amazing Results...
          </Typography>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 8,
      }}
    >
      {/* Add global confetti animation styles */}
      <style>{`
        @keyframes confetti-slow {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Top Class Section */}
        <AnimatePresence>
          {currentStep >= 0 && topClass && (
            <motion.div
              ref={classSectionRef}
              key="class"
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 1, type: 'spring' }}
            >
              <Card
                sx={{
                  bgcolor: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 4,
                  p: 6,
                  mb: 4,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  textAlign: 'center',
                }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                >
                  <Star sx={{ fontSize: 80, color: '#feca57', mb: 2 }} />
                </motion.div>
                
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: 'hsl(240, 6%, 25%)',
                    mb: 3,
                  }}
                >
                  🎯 Top Class 🎯
                </Typography>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: 'spring' }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      color: 'hsl(270, 60%, 50%)',
                      mb: 2,
                    }}
                  >
                    {topClass.name || topClass.homeroom}
                  </Typography>
                  
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: 'hsl(240, 6%, 46%)',
                      mb: 1,
                    }}
                  >
                    {topClass.totalCans || 0} cans
                  </Typography>
                  
                  <Box sx={{ mt: 3, display: 'inline-block' }}>
                    <TrendingUp sx={{ fontSize: 60, color: '#4ecdc4' }} />
                  </Box>
                </motion.div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top 3 Donors Section */}
        <AnimatePresence>
          {currentStep >= 1 && (
            <motion.div
              ref={donorsSectionRef}
              key="donors"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 1, type: 'spring' }}
            >
              <Card
                sx={{
                  bgcolor: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 4,
                  p: 6,
                  mb: 4,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: 'hsl(240, 6%, 25%)',
                    mb: 4,
                    textAlign: 'center',
                  }}
                >
                  🏆 Top Three Donors 🏆
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, justifyContent: 'center' }}>
                  {topStudents.map((student: any, index: number) => (
                    <Box
                      key={student.id}
                      component={motion.div}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.2, type: 'spring' }}
                      sx={{ flex: 1, maxWidth: { xs: '100%', md: '300px' } }}
                    >
                      <Card
                        sx={{
                          bgcolor: index === 0 ? '#fff9e6' : index === 1 ? '#f0f0f0' : '#ffe8cc',
                          border: index === 0 ? '3px solid #feca57' : index === 1 ? '3px solid #c0c0c0' : '3px solid #cd7f32',
                          borderRadius: 4,
                          p: 3,
                          textAlign: 'center',
                          position: 'relative',
                        }}
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 1 + index * 0.2, type: 'spring', stiffness: 200 }}
                        >
                          <Typography
                            sx={{
                              fontSize: '4rem',
                              mb: 1,
                            }}
                          >
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </Typography>
                        </motion.div>
                        
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: 'hsl(240, 6%, 25%)',
                            mb: 1,
                          }}
                        >
                          {student.name}
                        </Typography>
                        
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.2 + index * 0.2, type: 'spring' }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 800,
                              color: index === 0 ? '#feca57' : index === 1 ? '#c0c0c0' : '#cd7f32',
                              mb: 1,
                            }}
                          >
                            {student.totalCans || 0} cans
                          </Typography>
                        </motion.div>
                        
                        {student.grade && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'hsl(240, 6%, 46%)',
                            }}
                          >
                            Grade {student.grade}
                          </Typography>
                        )}
                      </Card>
                    </Box>
                  ))}
                </Box>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Total Cans Section */}
        <AnimatePresence>
          {currentStep >= 2 && (
            <motion.div
              ref={totalSectionRef}
              key="total"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 1, type: 'spring' }}
            >
              <Card
                sx={{
                  bgcolor: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 4,
                  p: 6,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  textAlign: 'center',
                }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                >
                  <EmojiEvents sx={{ fontSize: 80, color: '#feca57', mb: 2 }} />
                </motion.div>
                
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: 'hsl(240, 6%, 25%)',
                    mb: 2,
                  }}
                >
                  Total Cans Collected
                </Typography>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: 'spring', stiffness: 150 }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '4rem', md: '6rem' },
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 2,
                    }}
                  >
                    {totalCans.toLocaleString()}
                  </Typography>
                </motion.div>
                
                <Typography
                  variant="h5"
                  sx={{
                    color: 'hsl(240, 6%, 46%)',
                    fontWeight: 600,
                  }}
                >
                  Amazing work, everyone! 🎉
                </Typography>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
};

export default AssemblyReveal;
