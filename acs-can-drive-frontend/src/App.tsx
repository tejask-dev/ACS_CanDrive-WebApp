import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Landing from "@/components/pages/Landing";
import StudentSignup from "@/components/pages/StudentSignup";
import TeacherSignup from "@/components/pages/TeacherSignup";
import Leaderboard from "@/components/pages/Leaderboard";
import AdminLogin from "@/components/pages/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import NotFound from "@/components/pages/NotFound";

const queryClient = new QueryClient();

// Material UI Theme with school colors
const theme = createTheme({
  palette: {
    primary: {
      main: 'hsl(270, 60%, 50%)',
      light: 'hsl(270, 60%, 65%)',
      dark: 'hsl(270, 60%, 40%)',
    },
    secondary: {
      main: 'hsl(240, 6%, 50%)',
      light: 'hsl(240, 6%, 65%)',
      dark: 'hsl(240, 6%, 40%)',
    },
    success: {
      main: 'hsl(142, 76%, 36%)',
    },
    background: {
      default: 'hsl(0, 0%, 100%)',
      paper: 'hsl(0, 0%, 100%)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<StudentSignup />} />
            <Route path="/teacher-signup" element={<TeacherSignup />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
