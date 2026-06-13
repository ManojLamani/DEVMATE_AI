import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Code2 } from 'lucide-react';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)',
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    {/* Ambient blobs */}
    <Box
      sx={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }}
    />
    <Box
      sx={{
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }}
    />

    {/* Left branding panel */}
    <Box
      sx={{
        display: { xs: 'none', lg: 'flex' },
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        p: 8,
        position: 'relative',
      }}
    >
      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
          <Box
            sx={{
              width: 52, height: 52, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Code2 size={28} color="white" />
          </Box>
          <Typography variant="h5" fontWeight={800}>DevMate AI</Typography>
        </Box>
        <Typography variant="h2" fontWeight={800} sx={{ lineHeight: 1.2, mb: 3, maxWidth: 480 }}>
          Intelligent{' '}
          <Box
            component="span"
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            GitHub Repository
          </Box>{' '}
          Analysis Platform
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, lineHeight: 1.8 }}>
          Gain deep insights into any repository — contributors, languages, commit trends, and more. All in one beautiful dashboard.
        </Typography>

        {/* Feature list */}
        {['Analyze any public GitHub repo', 'Visualize language distribution', 'Track contributor stats', 'Monitor issues & PRs'].map((f, i) => (
          <motion.div
            key={f}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
              <Box
                sx={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                }}
              />
              <Typography variant="body2" color="text.secondary">{f}</Typography>
            </Box>
          </motion.div>
        ))}
      </motion.div>
    </Box>

    {/* Right form panel */}
    <Box
      sx={{
        flex: { xs: 1, lg: '0 0 480px' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <Box
          sx={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: 4,
            p: { xs: 3, sm: 5 },
          }}
        >
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Code2 size={22} color="white" />
            </Box>
            <Typography fontWeight={700} variant="h6">DevMate AI</Typography>
          </Box>

          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>{subtitle}</Typography>
          {children}
        </Box>
      </motion.div>
    </Box>
  </Box>
);
