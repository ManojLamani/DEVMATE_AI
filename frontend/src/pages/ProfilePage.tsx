import { Box, Typography, Avatar, Grid } from '@mui/material';
import { Mail, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { repositoryService } from '../services/repository.service';
import { GlassCard } from '../components/common/GlassCard';
import { PageWrapper } from '../components/common/PageWrapper';
import { StatCard } from '../components/common/StatCard';
import { formatDate, formatNumber } from '../utils/helpers';
import { GitFork, Star, Bug, Users } from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => repositoryService.getDashboardStats().then((r) => r.data.data),
  });

  const stats = data?.stats;

  return (
    <PageWrapper>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard
            sx={{
              p: 4, mb: 4,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(34,211,238,0.05) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <Avatar
                src={user?.avatar || undefined}
                sx={{
                  width: 88,
                  height: 88,
                  fontSize: 36,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>{user?.name}</Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Mail size={16} color="#94a3b8" />
                    <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                  </Box>
                  {user?.createdAt && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Calendar size={16} color="#94a3b8" />
                      <Typography variant="body2" color="text.secondary">
                        Joined {formatDate(user.createdAt)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </GlassCard>
        </motion.div>

        {/* Stats */}
        <Grid container spacing={3}>
          {[
            { title: 'Repositories', value: formatNumber(stats?.totalRepos || 0), icon: <GitFork size={22} />, color: '#6366f1' },
            { title: 'Total Stars', value: formatNumber(stats?.totalStars || 0), icon: <Star size={22} />, color: '#fbbf24' },
            { title: 'Open Issues', value: formatNumber(stats?.totalIssues || 0), icon: <Bug size={22} />, color: '#f87171' },
            { title: 'Contributors', value: formatNumber(stats?.totalContributors || 0), icon: <Users size={22} />, color: '#34d399' },
          ].map((s, i) => (
            <Grid item xs={12} sm={6} key={s.title}>
              <StatCard {...s} loading={isLoading} index={i} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageWrapper>
  );
};
