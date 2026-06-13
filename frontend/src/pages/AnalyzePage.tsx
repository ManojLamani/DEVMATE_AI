import { useState } from 'react';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress,
  InputAdornment, Chip,
} from '@mui/material';
import { GitBranch, Search, Zap, Star, GitFork, ArrowRight } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { repositoryService } from '../services/repository.service';
import { GlassCard } from '../components/common/GlassCard';
import { PageWrapper } from '../components/common/PageWrapper';
import { Repository } from '../types';
import { formatNumber } from '../utils/helpers';

const POPULAR_REPOS = [
  'https://github.com/facebook/react',
  'https://github.com/microsoft/vscode',
  'https://github.com/vercel/next.js',
  'https://github.com/tailwindlabs/tailwindcss',
  'https://github.com/vitejs/vite',
];

export const AnalyzePage = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Repository | null>(null);

  const handleAnalyze = async (repoUrl = url) => {
    if (!repoUrl.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await repositoryService.analyze(repoUrl.trim());
      setResult(data.data.repository);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to analyze repository. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box
              sx={{
                width: 72, height: 72, borderRadius: 3, mx: 'auto', mb: 3,
                background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <GitBranch size={36} color="white" />
            </Box>
            <Typography variant="h3" fontWeight={800} sx={{ mb: 1 }}>
              Analyze Repository
            </Typography>
            <Typography color="text.secondary" variant="h6" fontWeight={400}>
              Paste any public GitHub repository URL to get detailed insights
            </Typography>
          </Box>
        </motion.div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard sx={{ p: 4, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                placeholder="https://github.com/owner/repository"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GitBranch size={20} color="#6366f1" />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
              />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => handleAnalyze()}
                  disabled={loading || !url.trim()}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Zap size={18} />}
                  sx={{ whiteSpace: 'nowrap', minWidth: 160, height: 56 }}
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </Button>
              </motion.div>
            </Box>

            {/* Popular repos */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                Try a popular repository:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {POPULAR_REPOS.map((repo) => {
                  const label = repo.replace('https://github.com/', '');
                  return (
                    <Chip
                      key={repo}
                      label={label}
                      size="small"
                      clickable
                      onClick={() => { setUrl(repo); handleAnalyze(repo); }}
                      sx={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        color: 'primary.light',
                        '&:hover': { background: 'rgba(99, 102, 241, 0.2)' },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          </GlassCard>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GlassCard sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ mb: 3 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}
                  >
                    <Box
                      sx={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto',
                      }}
                    >
                      <Search size={24} color="white" />
                    </Box>
                  </motion.div>
                </Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Analyzing Repository</Typography>
                {['Fetching repository info...', 'Loading contributors...', 'Analyzing languages...', 'Processing issues & PRs...'].map((step, i) => (
                  <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.4 }}>
                    <Typography variant="body2" color="text.secondary">{step}</Typography>
                  </motion.div>
                ))}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Preview */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GlassCard
                sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(34,211,238,0.05) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>{result.fullName}</Typography>
                    {result.description && (
                      <Typography color="text.secondary" sx={{ maxWidth: 500 }}>{result.description}</Typography>
                    )}
                  </Box>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="contained"
                      endIcon={<ArrowRight size={18} />}
                      onClick={() => navigate(`/repositories/${result.id}`)}
                    >
                      View Analysis
                    </Button>
                  </motion.div>
                </Box>

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                  {[
                    { icon: <Star size={16} color="#fbbf24" />, value: formatNumber(result.stars), label: 'Stars' },
                    { icon: <GitFork size={16} color="#94a3b8" />, value: formatNumber(result.forks), label: 'Forks' },
                    { icon: <Search size={16} color="#f87171" />, value: formatNumber(result.openIssues), label: 'Issues' },
                  ].map((stat) => (
                    <Box key={stat.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {stat.icon}
                      <Typography fontWeight={600}>{stat.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                    </Box>
                  ))}
                </Box>

                {result.languages && result.languages.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {result.languages.slice(0, 6).map((lang) => (
                      <Chip
                        key={lang.name}
                        label={`${lang.name} ${lang.percentage}%`}
                        size="small"
                        sx={{
                          background: `${lang.color || '#6366f1'}20`,
                          border: `1px solid ${lang.color || '#6366f1'}40`,
                          color: lang.color || '#6366f1',
                        }}
                      />
                    ))}
                  </Box>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </PageWrapper>
  );
};
