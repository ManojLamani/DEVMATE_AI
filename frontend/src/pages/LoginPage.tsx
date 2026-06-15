import { useState } from 'react';
import {
  Box, Button, TextField, Typography,
  InputAdornment, IconButton, Alert, CircularProgress,
} from '@mui/material';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { AuthLayout } from '../components/auth/AuthLayout';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authService.login(form);
      setAuth(data.data.user, data.data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Analyze GitHub repositories with AI-powered insights">
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
        </motion.div>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Mail size={18} color="#6366f1" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock size={18} color="#6366f1" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
          </Button>
        </motion.div>
      </Box>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
          Create one
        </Link>
      </Typography>
    </AuthLayout>
  );
};
