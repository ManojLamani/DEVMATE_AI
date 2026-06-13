import { useState } from 'react';
import {
  Box, Button, TextField, Typography, Divider,
  InputAdornment, IconButton, Alert, CircularProgress,
} from '@mui/material';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { AuthLayout } from '../components/auth/AuthLayout';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authService.register(form);
      setAuth(data.data.user, data.data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await authService.googleAuth(credential);
      setAuth(data.data.user, data.data.token);
      navigate('/dashboard');
    } catch {
      setError('Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Start analyzing GitHub repositories today">
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
        </motion.div>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Full Name"
          fullWidth
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><User size={18} color="#6366f1" /></InputAdornment>
            ),
          }}
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><Mail size={18} color="#6366f1" /></InputAdornment>
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
          helperText="Minimum 6 characters"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><Lock size={18} color="#6366f1" /></InputAdornment>
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
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
          </Button>
        </motion.div>
      </Box>

      <Divider sx={{ my: 3, borderColor: 'rgba(148,163,184,0.12)' }}>
        <Typography variant="caption" color="text.secondary">OR</Typography>
      </Divider>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={(r) => r.credential && handleGoogle(r.credential)}
          onError={() => setError('Google sign-in failed.')}
          theme="filled_black"
          shape="pill"
          size="large"
          width="340"
        />
      </Box>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </Typography>
    </AuthLayout>
  );
};
