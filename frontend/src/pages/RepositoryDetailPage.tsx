import { useState } from 'react';
import {
  Box, Typography, Grid, Chip, Avatar, Button, Tab, Tabs,
  LinearProgress, Skeleton, Link as MuiLink, CircularProgress, Tooltip as MuiTooltip,
} from '@mui/material';
import {
  Star, GitFork, Bug, Eye, GitBranch, Users, Code, ExternalLink,
  GitPullRequest, Activity, ArrowLeft, Brain, Layers,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { repositoryService } from '../services/repository.service';
import { GlassCard } from '../components/common/GlassCard';
import { PageWrapper } from '../components/common/PageWrapper';
import { formatNumber, timeAgo, formatBytes } from '../utils/helpers';

const COLORS = ['#6366f1','#22d3ee','#f59e0b','#34d399','#f87171','#a78bfa','#fb923c','#38bdf8'];

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

export const RepositoryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [mlLoading, setMlLoading] = useState<'predict' | 'cluster' | null>(null);
  const [mlDone, setMlDone] = useState<string[]>([]);

  const { data: repoData, isLoading: repoLoading } = useQuery({
    queryKey: ['repository', id],
    queryFn: () => repositoryService.getById(id!).then((r) => r.data.data.repository),
    enabled: !!id,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', id],
    queryFn: () => repositoryService.getAnalytics(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const loading = repoLoading || analyticsLoading;
  const repo = repoData;
  const analytics = analyticsData;

  const handlePredictDifficulty = async () => {
    if (!repo?.issues?.length) return;
    setMlLoading('predict');
    try {
      for (const issue of repo.issues.slice(0, 20)) {
        await repositoryService.predictIssueDifficulty(issue.id).catch(() => {});
      }
      setMlDone(d => [...d, 'predict']);
    } finally {
      setMlLoading(null);
    }
  };

  const handleClusterIssues = async () => {
    if (!id) return;
    setMlLoading('cluster');
    try {
      await repositoryService.clusterIssues(id);
      setMlDone(d => [...d, 'cluster']);
    } finally {
      setMlLoading(null);
    }
  };

  const commitTrend = analytics?.commitTrend?.slice(-12) || [];
  const prData = analytics
    ? [
        { name: 'Open', value: analytics.pullRequests.open, color: '#34d399' },
        { name: 'Merged', value: analytics.pullRequests.merged, color: '#6366f1' },
        { name: 'Closed', value: analytics.pullRequests.closed, color: '#f87171' },
      ]
    : [];

  return (
    <PageWrapper>
      {/* Back button */}
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate('/repositories')}
        sx={{ mb: 3, color: 'text.secondary' }}
      >
        Back to Repositories
      </Button>

      {loading ? (
        <Box>
          <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 3, mb: 3 }} />
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map(i => <Grid item xs={6} md={3} key={i}><Skeleton height={120} sx={{ borderRadius: 2 }} /></Grid>)}
          </Grid>
        </Box>
      ) : !repo ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h6">Repository not found</Typography>
        </Box>
      ) : (
        <>
          {/* Hero Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard
              sx={{
                p: 4, mb: 4,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(34,211,238,0.06) 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography variant="h4" fontWeight={800}>{repo.fullName}</Typography>
                    {repo.isPrivate && <Chip label="Private" size="small" color="warning" />}
                    {repo.isFork && <Chip label="Fork" size="small" />}
                    {repo.isArchived && <Chip label="Archived" size="small" color="error" />}
                  </Box>
                  {repo.description && (
                    <Typography color="text.secondary" variant="body1" sx={{ mb: 2, maxWidth: 600 }}>
                      {repo.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {repo.topics?.slice(0, 8).map(topic => (
                      <Chip key={topic} label={topic} size="small" sx={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)' }} />
                    ))}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignSelf: 'flex-start' }}>
                  <Button
                    variant="outlined"
                    endIcon={<ExternalLink size={16} />}
                    component={MuiLink}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ borderColor: 'rgba(99,102,241,0.4)', color: 'primary.light', height: 38 }}
                  >
                    View on GitHub
                  </Button>
                  <MuiTooltip title={!repo.issues?.length ? 'No issues to analyze' : ''}>
                    <span>
                      <Button
                        variant="contained"
                        startIcon={mlLoading === 'predict' ? <CircularProgress size={14} color="inherit" /> : <Brain size={16} />}
                        onClick={handlePredictDifficulty}
                        disabled={!repo.issues?.length || mlLoading !== null}
                        size="small"
                        fullWidth
                        sx={{ bgcolor: mlDone.includes('predict') ? '#34d399' : '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
                      >
                        {mlDone.includes('predict') ? 'Difficulty Predicted ✓' : 'Predict Issue Difficulty'}
                      </Button>
                    </span>
                  </MuiTooltip>
                  <Button
                    variant="outlined"
                    startIcon={mlLoading === 'cluster' ? <CircularProgress size={14} color="inherit" /> : <Layers size={16} />}
                    onClick={handleClusterIssues}
                    disabled={!repo.issues?.length || mlLoading !== null}
                    size="small"
                    sx={{ borderColor: 'rgba(34,211,238,0.4)', color: '#22d3ee' }}
                  >
                    {mlDone.includes('cluster') ? 'Issues Clustered ✓' : 'Cluster Issues'}
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 4, mt: 3, flexWrap: 'wrap' }}>
                {[
                  { icon: <Star size={16} color="#fbbf24" />, value: formatNumber(repo.stars), label: 'Stars' },
                  { icon: <GitFork size={16} color="#94a3b8" />, value: formatNumber(repo.forks), label: 'Forks' },
                  { icon: <Bug size={16} color="#f87171" />, value: formatNumber(repo.openIssues), label: 'Issues' },
                  { icon: <Eye size={16} color="#22d3ee" />, value: formatNumber(repo.watchers), label: 'Watchers' },
                  { icon: <GitBranch size={16} color="#34d399" />, value: repo.branches?.length || 0, label: 'Branches' },
                  { icon: <Users size={16} color="#a78bfa" />, value: repo.contributors?.length || 0, label: 'Contributors' },
                ].map(stat => (
                  <Box key={stat.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {stat.icon}
                    <Typography fontWeight={700}>{stat.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  </Box>
                ))}
              </Box>
            </GlassCard>
          </motion.div>

          {/* Tabs */}
          <GlassCard sx={{ mb: 4 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                px: 2,
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 56 },
                '& .Mui-selected': { color: 'primary.light' },
                '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #6366f1, #22d3ee)', height: 3, borderRadius: 2 },
              }}
            >
              <Tab icon={<Activity size={16} />} iconPosition="start" label="Overview" />
              <Tab icon={<Code size={16} />} iconPosition="start" label="Languages" />
              <Tab icon={<Users size={16} />} iconPosition="start" label="Contributors" />
              <Tab icon={<Bug size={16} />} iconPosition="start" label="Issues" />
              <Tab icon={<GitPullRequest size={16} />} iconPosition="start" label="Pull Requests" />
            </Tabs>
          </GlassCard>

          {/* Tab: Overview */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <GlassCard sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Commit Activity (Last 12 Weeks)</Typography>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={commitTrend}>
                      <defs>
                        <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                      <XAxis dataKey="week" stroke="#475569" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8 }} />
                      <Area type="monotone" dataKey="commits" stroke="#6366f1" strokeWidth={2} fill="url(#cGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassCard>
              </Grid>
              <Grid item xs={12} lg={4}>
                <GlassCard sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Pull Requests</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={prData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                        {prData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </GlassCard>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab: Languages */}
          <TabPanel value={tab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <GlassCard sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Language Distribution</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {repo.languages?.sort((a, b) => b.percentage - a.percentage).map((lang, i) => (
                      <Box key={lang.name}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: lang.color || COLORS[i % COLORS.length] }} />
                            <Typography variant="body2" fontWeight={500}>{lang.name}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">{formatBytes(lang.bytes)}</Typography>
                            <Typography variant="caption" fontWeight={600}>{lang.percentage}%</Typography>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={lang.percentage}
                          sx={{ '& .MuiLinearProgress-bar': { background: lang.color || COLORS[i % COLORS.length] } }}
                        />
                      </Box>
                    ))}
                  </Box>
                </GlassCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <GlassCard sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Languages Chart</Typography>
                  <ResponsiveContainer width="100%" height={340}>
                    <PieChart>
                      <Pie
                        data={repo.languages?.slice(0, 8).map(l => ({ name: l.name, value: l.percentage }))}
                        cx="50%" cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, value }) => `${name} ${value}%`}
                        labelLine={false}
                      >
                        {repo.languages?.slice(0, 8).map((l, i) => (
                          <Cell key={l.name} fill={l.color || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </GlassCard>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab: Contributors */}
          <TabPanel value={tab} index={2}>
            <Grid container spacing={3}>
              {/* Top contributors bar chart */}
              <Grid item xs={12} md={7}>
                <GlassCard sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Top Contributors</Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={repo.contributors?.slice(0, 10).map(c => ({ name: c.login, contributions: c.contributions }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                      <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8 }} />
                      <Bar dataKey="contributions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </GlassCard>
              </Grid>
              <Grid item xs={12} md={5}>
                <GlassCard sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Contributor List</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {repo.contributors?.slice(0, 8).map((c, i) => (
                      <motion.div key={c.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={c.avatarUrl || undefined} sx={{ width: 36, height: 36 }}>
                            {c.login.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{c.login}</Typography>
                            <Typography variant="caption" color="text.secondary">{formatNumber(c.contributions)} commits</Typography>
                          </Box>
                          <Chip
                            label={`#${i + 1}`}
                            size="small"
                            sx={{ background: i === 0 ? 'rgba(251,191,36,0.2)' : 'rgba(99,102,241,0.1)', color: i === 0 ? '#fbbf24' : 'primary.light' }}
                          />
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                </GlassCard>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab: Issues */}
          <TabPanel value={tab} index={3}>
            <GlassCard sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Open Issues ({formatNumber(repo.openIssues)})
              </Typography>
              {repo.issues?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography color="text.secondary">No open issues</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {repo.issues?.map((issue, i) => (
                    <motion.div key={issue.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <Box
                        sx={{
                          p: 2.5, borderRadius: 2,
                          background: 'rgba(30,41,59,0.4)',
                          border: '1px solid rgba(148,163,184,0.06)',
                          '&:hover': { borderColor: 'rgba(99,102,241,0.2)' },
                          transition: 'border-color 0.2s',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <Bug size={16} color="#f87171" style={{ flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600}>#{issue.number} {issue.title}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 2, flexShrink: 0 }}>
                            {issue.githubCreatedAt ? timeAgo(issue.githubCreatedAt) : ''}
                          </Typography>
                        </Box>
                        {issue.labels?.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                            {issue.labels.map(label => (
                              <Chip key={label} label={label} size="small" sx={{ height: 18, fontSize: 10 }} />
                            ))}
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          {issue.authorAvatar && <Avatar src={issue.authorAvatar} sx={{ width: 18, height: 18 }} />}
                          <Typography variant="caption" color="text.secondary">{issue.author}</Typography>
                          {issue.comments > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              · {issue.comments} comments
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              )}
            </GlassCard>
          </TabPanel>

          {/* Tab: Pull Requests */}
          <TabPanel value={tab} index={4}>
            <GlassCard sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Pull Requests</Typography>
              {repo.pullRequests?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography color="text.secondary">No pull requests</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {repo.pullRequests?.map((pr, i) => (
                    <motion.div key={pr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <Box
                        sx={{
                          p: 2.5, borderRadius: 2,
                          background: 'rgba(30,41,59,0.4)',
                          border: '1px solid rgba(148,163,184,0.06)',
                          '&:hover': { borderColor: 'rgba(99,102,241,0.2)' },
                          transition: 'border-color 0.2s',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <GitPullRequest size={16} color={pr.state === 'open' ? '#34d399' : pr.mergedAt ? '#a78bfa' : '#f87171'} style={{ flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600}>#{pr.number} {pr.title}</Typography>
                            {pr.draft && <Chip label="Draft" size="small" sx={{ height: 18, fontSize: 10 }} />}
                          </Box>
                          <Chip
                            label={pr.mergedAt ? 'Merged' : pr.state}
                            size="small"
                            sx={{
                              ml: 1,
                              height: 20,
                              fontSize: 10,
                              background: pr.mergedAt ? 'rgba(167,139,250,0.15)' : pr.state === 'open' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                              color: pr.mergedAt ? '#a78bfa' : pr.state === 'open' ? '#34d399' : '#f87171',
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="success.main">+{formatNumber(pr.additions)}</Typography>
                          <Typography variant="caption" color="error.main">-{formatNumber(pr.deletions)}</Typography>
                          <Typography variant="caption" color="text.secondary">{pr.changedFiles} files</Typography>
                          {pr.author && <Typography variant="caption" color="text.secondary">by {pr.author}</Typography>}
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              )}
            </GlassCard>
          </TabPanel>
        </>
      )}
    </PageWrapper>
  );
};
