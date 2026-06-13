import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Navbar } from './Navbar';
import { Box } from '@mui/material';

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #0d1520 100%)' }}>
      <Navbar />
      <Outlet />
    </Box>
  );
};
