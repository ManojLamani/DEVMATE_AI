import { useState } from 'react';
import {
  Box, Grid, Typography, Button, Chip, CircularProgress,
  LinearProgress, Alert, Tooltip, Divider,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ScatterChart,
  Scatter, Legend,
} from 'recharts';
import {
  Brain, Layers, GitBranch, Zap, RefreshCw, TrendingUp,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PageWrapper } from '../components/common/PageWrapper';
import { GlassCard } from '../components/common/GlassCard';
import { getMLDashboard, clusterAllRepositories, MLDashboardData } from '../services/ml.service';

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#22d3ee',
  Medium: '#f59e0b',
  Hard: '#ef4444',
};

const CATEGORY_COLORS: Record<string, string> = {
  Bug: '#ef4444',
  Documentation: '#6366f1',
  'Feature Request': '#22d3ee',
  Security: '#f59e0b',
  Testing: '#10b981',
};

const CLUSTER_COLORS: Record<string, string> = {
  Frontend: '#6366f1',
  Backend: '#22d3ee',
  'Full Stack': '#10b981',
  'AI/ML': '#f59e0b',
  DevOps: '#ef4444',
  Cloud: '#8b5cf6',
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => (
  <GlassCard sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{ p: 1.5, borderRadius: 2, background: `${color}22`, color }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={700}>{value}</Typography>
    </Box>
  </GlassCard>
);

export const AIInsightsPage = () => {
  const [runningCluster, setRunningCluster] = useState(false);

  const { data: dash, isLoading, refetch } = useQuery<{ success: boolean; data: MLDashboardData }>({
    queryKey: ['ml-dashboard'],
    queryFn: () => getMLDashboard().then((r) => r.data),
  });

  const clusterMutation = useMutation({
    mutationFn: () => clusterAllRepositories().then((r) => r.data),
    onSuccess: () => {
      setRunningCluster(false);
      refetch();
    },
    onSettled: () => setRunningCluster(false),
  });

  const d = dash?.data;

  const totalIssues = (d?.issue_difficulties ?? []).reduce((a, b) => a + b.count, 0);
  const totalClustered = (d?.issue_categories ?? []).reduce((a, b) => a + b.count, 0);
  const totalRepos = d?.repo_clusters?.length ?? 0;

  return (
    <PageWrapper title="AI Insights" subtitle="Machine learning analysis of your repositories and issues">
      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="contained"
            startIcon={runningCluster ? <CircularProgress size={16} color="inherit" /> : <Layers size={16} />}
            onClick={() => { setRunningCluster(true); clusterMutation.mutate(); }}
            disabled={runningCluster}
          >
            Cluster All Repositories
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={() => refetch()}>
            Refresh
          </Button>
        </motion.div>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

      {/* Summary stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <StatCard icon={<Brain size={20} />} label="Issues Analyzed" value={totalIssues} color="#6366f1" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon={<Zap size={20} />} label="Issues Clustered" value={totalClustered} color="#22d3ee" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon={<GitBranch size={20} />} label="Repos Clustered" value={totalRepos} color="#10b981" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Issue Difficulty Distribution */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
              <Brain size={18} style={{ color: '#6366f1' }} /> Issue Difficulty Breakdown
            </Typography>
            {(d?.issue_difficulties?.length ?? 0) === 0 ? (
              <Alert severity="info">No difficulty predictions yet. Open a repository and predict issue difficulty.</Alert>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={d?.issue_difficulties ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="difficulty" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <RTooltip
                      contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8 }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {(d?.issue_difficulties ?? []).map((entry) => (
                        <Cell key={entry.difficulty} fill={DIFFICULTY_COLORS[entry.difficulty] || '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {(d?.issue_difficulties ?? []).map((d2) => (
                    <Box key={d2.difficulty} display="flex" alignItems="center" gap={1.5}>
                      <Chip
                        label={d2.difficulty}
                        size="small"
                        sx={{ bgcolor: `${DIFFICULTY_COLORS[d2.difficulty]}22`, color: DIFFICULTY_COLORS[d2.difficulty], minWidth: 70 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={d2.avg_confidence}
                          sx={{
                            height: 6, borderRadius: 3,
                            '& .MuiLinearProgress-bar': { bgcolor: DIFFICULTY_COLORS[d2.difficulty] },
                            bgcolor: 'rgba(255,255,255,0.05)',
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{d2.avg_confidence}% conf.</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </GlassCard>
        </Grid>

        {/* Issue Category Pie */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
              <Layers size={18} style={{ color: '#22d3ee' }} /> Issue Categories (NLP Clustering)
            </Typography>
            {(d?.issue_categories?.length ?? 0) === 0 ? (
              <Alert severity="info">No issue clusters yet. Run issue clustering from a repository.</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={d?.issue_categories ?? []}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(d?.issue_categories ?? []).map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#6366f1'} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <RTooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </GlassCard>
        </Grid>

        {/* Repository Cluster Scatter (PCA) */}
        <Grid item xs={12}>
          <GlassCard sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
              <TrendingUp size={18} style={{ color: '#10b981' }} /> Repository Clusters (PCA Visualization)
            </Typography>
            {(d?.repo_clusters?.filter((r) => r.pca_x != null).length ?? 0) === 0 ? (
              <Alert severity="info">No clustered repos with PCA coordinates yet. Click "Cluster All Repositories".</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart margin={{ top: 10, right: 30, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="pca_x" name="PCA-1" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis dataKey="pca_y" name="PCA-2" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <RTooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8 }}
                    formatter={(_: any, name: string, props: any) => [props.payload.repo_name, name]}
                  />
                  {Object.entries(CLUSTER_COLORS).map(([cluster, color]) => {
                    const points = (d?.repo_clusters ?? []).filter((r) => r.cluster === cluster && r.pca_x != null);
                    if (points.length === 0) return null;
                    return (
                      <Scatter key={cluster} name={cluster} data={points} fill={color} opacity={0.85} />
                    );
                  })}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </ScatterChart>
              </ResponsiveContainer>
            )}

            {/* Cluster breakdown list */}
            {(d?.repo_clusters?.length ?? 0) > 0 && (
              <>
                <Divider sx={{ my: 2, borderColor: 'rgba(148,163,184,0.1)' }} />
                <Grid container spacing={1}>
                  {(d?.repo_clusters ?? []).map((r) => (
                    <Grid item key={r.repo_name} xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1.5,
                          p: 1.5, borderRadius: 2,
                          border: '1px solid rgba(148,163,184,0.08)',
                        }}
                      >
                        <Box
                          sx={{
                            width: 10, height: 10, borderRadius: '50%',
                            bgcolor: CLUSTER_COLORS[r.cluster] || '#6366f1', flexShrink: 0,
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Tooltip title={r.repo_name}>
                            <Typography variant="body2" fontWeight={500} noWrap>{r.repo_name}</Typography>
                          </Tooltip>
                          <Typography variant="caption" color="text.secondary">{r.cluster} · {r.confidence}%</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </GlassCard>
        </Grid>
      </Grid>
    </PageWrapper>
  );
};
