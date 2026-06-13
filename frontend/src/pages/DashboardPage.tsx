import { Box, Grid, Typography, Skeleton, Button, Chip, LinearProgress } from '@mui/material';
import {
  GitFork, Star, Bug, Users, TrendingUp, ArrowRight, Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { repositoryService } from '../services/repository.service';
import { useAuthStore } from '../store/authStore';
import { StatCard } from '../components/common/StatCard';
import { GlassCard } from '../components/common/GlassCard';
import { PageWrapper } from '../components/common/PageWrapper';
import { formatNumber, timeAgo } from '../utils/helpers';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#34d399', '#f87171', '#a78bfa', '#fb923c', '#38bdf8'];

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => repositoryService.getDashboardStats().then((r) => r.data.data),
  });

  const stats = data?.stats;
  const topLanguages = data?.topLanguages || [];
  const recentRepos = data?.recentRepos || [];

  // Build commit trend mock from recentRepos if no real data
  const trendData = Array.from({ length: 8 }, (_, i) => ({
    week: `W${i + 1}`,
    commits: Math.floor(Math.random() * 40) + 5,
  }));

  return (
    <PageWrapper>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
              Good morning,{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {user?.name?.split(' ')[0]}
              </Box>{' '}
              👋
            </Typography>
            <Typography color="text.secondary">
              Here's what's happening with your repositories.
            </Typography>
          </motion.div>
        </Box>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button variant="contained" startIcon={<Zap size={18} />} onClick={() => navigate('/analyze')}>
            Analyze Repository
          </Button>
        </motion.div>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: 'Repositories', value: formatNumber(stats?.totalRepos || 0), icon: <GitFork size={22} />, color: '#6366f1', subtitle: 'Total analyzed' },
          { title: 'Open Issues', value: formatNumber(stats?.totalIssues || 0), icon: <Bug size={22} />, color: '#f87171', subtitle: 'Across all repos' },
          { title: 'Contributors', value: formatNumber(stats?.totalContributors || 0), icon: <Users size={22} />, color: '#34d399', subtitle: 'Unique contributors' },
          { title: 'Total Stars', value: formatNumber(stats?.totalStars || 0), icon: <Star size={22} />, color: '#fbbf24', subtitle: 'GitHub stars' },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} lg={3} key={s.title}>
            <StatCard {...s} loading={isLoading} index={i} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Commit Activity Chart */}
        <Grid item xs={12} lg={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Activity Overview</Typography>
                  <Typography variant="caption" color="text.secondary">Commit activity trend</Typography>
                </Box>
                <TrendingUp size={20} style={{ color: '#6366f1' }} />
              </Box>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="week" stroke="#475569" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Area type="monotone" dataKey="commits" stroke="#6366f1" strokeWidth={2} fill="url(#colorCommits)" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          </motion.div>
        </Grid>

        {/* Language Distribution */}
        <Grid item xs={12} lg={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <GlassCard sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>Languages</Typography>
              <Typography variant="caption" color="text.secondary">Distribution across repos</Typography>
              {isLoading ? (
                <Box sx={{ mt: 3 }}>{[1, 2, 3, 4].map(i => <Skeleton key={i} height={40} sx={{ mb: 1 }} />)}</Box>
              ) : topLanguages.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <Typography color="text.secondary" variant="body2">No data yet</Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {topLanguages.slice(0, 5).map((lang, i) => (
                      <Box key={lang.name}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={500}>{lang.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{lang.percentage}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={lang.percentage}
                          sx={{ '& .MuiLinearProgress-bar': { background: COLORS[i % COLORS.length] } }}
                        />
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </GlassCard>
          </motion.div>
        </Grid>
      </Grid>

      {/* Recent Repositories */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <GlassCard sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>Recent Repositories</Typography>
              <Typography variant="caption" color="text.secondary">Recently analyzed repositories</Typography>
            </Box>
            <Button
              endIcon={<ArrowRight size={16} />}
              onClick={() => navigate('/repositories')}
              size="small"
              sx={{ color: 'primary.light' }}
            >
              View all
            </Button>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} height={70} />)}
            </Box>
          ) : recentRepos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>No repositories analyzed yet.</Typography>
              <Button variant="contained" startIcon={<Zap size={16} />} onClick={() => navigate('/analyze')}>
                Analyze Your First Repo
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentRepos.map((repo, i) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  whileHover={{ x: 4 }}
                >
                  <Box
                    onClick={() => navigate(`/repositories/${repo.id}`)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      cursor: 'pointer',
                      background: 'rgba(30, 41, 59, 0.4)',
                      border: '1px solid rgba(148,163,184,0.06)',
                      transition: 'all 0.2s',
                      '&:hover': { background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 42, height: 42, borderRadius: 2,
                        background: 'linear-gradient(135deg, #6366f120, #22d3ee20)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}
                    >
                      <GitFork size={20} style={{ color: '#6366f1' }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>{repo.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {repo.description || 'No description'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star size={14} style={{ color: '#fbbf24' }} />
                        <Typography variant="caption">{formatNumber(repo.stars)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <GitFork size={14} style={{ color: '#94a3b8' }} />
                        <Typography variant="caption">{formatNumber(repo.forks)}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexWrap: 'wrap', maxWidth: 120 }}>
                      {repo.languages?.slice(0, 2).map(lang => (
                        <Chip key={lang.name} label={lang.name} size="small" sx={{ fontSize: 10, height: 20 }} />
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
                      {timeAgo(repo.updatedAt)}
                    </Typography>
                    <ArrowRight size={16} style={{ color: '#475569' }} />
                  </Box>
                </motion.div>
              ))}
            </Box>
          )}
        </GlassCard>
      </motion.div>
    </PageWrapper>
  );
};
