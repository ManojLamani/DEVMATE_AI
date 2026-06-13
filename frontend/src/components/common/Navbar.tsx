import { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, IconButton, Avatar,
  Menu, MenuItem, Divider, Button, Tooltip,
} from '@mui/material';
import {
  Code2, LogOut, User, ChevronDown, Zap,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Repositories', path: '/repositories' },
  { label: 'AI Insights', path: '/ai-insights' },
  { label: 'Recommendations', path: '/recommendations' },
];

export const Navbar = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
        top: 0,
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1 }}>
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.02 }}>
          <Box
            onClick={() => navigate('/dashboard')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', mr: 5 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Code2 size={20} color="white" />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
              DevMate{' '}
              <Box component="span" sx={{ color: 'primary.main' }}>
                AI
              </Box>
            </Typography>
          </Box>
        </motion.div>

        {/* Nav Links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                color: location.pathname.startsWith(item.path) ? 'primary.light' : 'text.secondary',
                fontWeight: location.pathname.startsWith(item.path) ? 600 : 400,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: location.pathname.startsWith(item.path) ? '80%' : '0%',
                  height: 2,
                  background: 'linear-gradient(90deg, #6366f1, #22d3ee)',
                  borderRadius: 1,
                  transition: 'width 0.3s',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Analyze Button */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Zap size={16} />}
            onClick={() => navigate('/analyze')}
            sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}
          >
            Analyze Repo
          </Button>
        </motion.div>

        {/* User Menu */}
        <Tooltip title="Account">
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={user?.avatar || undefined}
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <ChevronDown size={16} style={{ color: '#94a3b8' }} />
            </Box>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 200,
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: 2,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.1)' }} />
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
            <User size={16} style={{ marginRight: 10 }} /> Profile
          </MenuItem>
          <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.1)' }} />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <LogOut size={16} style={{ marginRight: 10 }} /> Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
