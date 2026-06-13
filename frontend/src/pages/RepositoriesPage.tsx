import { useState } from 'react';
import {
  Box, Typography, Button, Grid, Chip, TextField, InputAdornment,
  Skeleton, Pagination, IconButton, Tooltip,
} from '@mui/material';
import { Search, Zap, Star, GitFork, Bug, Trash2, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { repositoryService } from '../services/repository.service';
import { GlassCard } from '../components/common/GlassCard';
import { PageWrapper } from '../components/common/PageWrapper';
import { formatNumber, timeAgo } from '../utils/helpers';

export const RepositoriesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['repositories', page],
    queryFn: () => repositoryService.getAll(page, 12).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: repositoryService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repositories'] }),
  });

  const repos = data?.repositories || [];
  const filtered = repos.filter(
    (r) =>
      !search ||
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Repositories</Typography>
          <Typography color="text.secondary">
            {data?.total || 0} repositories analyzed
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Zap size={18} />} onClick={() => navigate('/analyze')}>
          Analyze New Repo
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><Search size={18} color="#6366f1" /></InputAdornment>
            ),
          }}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Grid item xs={12} sm={6} lg={4} key={i}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Box
            sx={{
              width: 80, height: 80, borderRadius: 3, mx: 'auto', mb: 3,
              background: 'rgba(99,102,241,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <GitFork size={36} color="#6366f1" />
          </Box>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>No repositories found</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {search ? 'Try a different search term.' : 'Start by analyzing a GitHub repository.'}
          </Typography>
          {!search && (
            <Button variant="contained" startIcon={<Zap size={16} />} onClick={() => navigate('/analyze')}>
              Analyze Your First Repo
            </Button>
          )}
        </Box>
      ) : (
        <AnimatePresence mode="popLayout">
          <Grid container spacing={3}>
            {filtered.map((repo, i) => (
              <Grid item xs={12} sm={6} lg={4} key={repo.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ height: '100%' }}
                >
                  <GlassCard
                    hover
                    sx={{
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'rgba(99,102,241,0.3)' },
                    }}
                    onClick={() => navigate(`/repositories/${repo.id}`)}
                  >
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>{repo.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{repo.fullName}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }} onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Open on GitHub">
                          <IconButton
                            size="small"
                            component="a"
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}
                          >
                            <ExternalLink size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => deleteMutation.mutate(repo.id)}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {repo.description || 'No description available'}
                    </Typography>

                    {/* Stats */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star size={14} color="#fbbf24" />
                        <Typography variant="caption" fontWeight={500}>{formatNumber(repo.stars)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <GitFork size={14} color="#94a3b8" />
                        <Typography variant="caption">{formatNumber(repo.forks)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Bug size={14} color="#f87171" />
                        <Typography variant="caption">{formatNumber(repo.openIssues)}</Typography>
                      </Box>
                    </Box>

                    {/* Languages */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {repo.languages?.slice(0, 3).map(lang => (
                        <Chip
                          key={lang.name}
                          label={lang.name}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10,
                            background: `${lang.color || '#6366f1'}20`,
                            color: lang.color || '#6366f1',
                            border: `1px solid ${lang.color || '#6366f1'}30`,
                          }}
                        />
                      ))}
                    </Box>

                    {/* Footer */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                      <Typography variant="caption" color="text.secondary">
                        Updated {timeAgo(repo.updatedAt)}
                      </Typography>
                      {repo.isPrivate && (
                        <Chip label="Private" size="small" sx={{ height: 18, fontSize: 9 }} />
                      )}
                    </Box>
                  </GlassCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </AnimatePresence>
      )}

      {(data?.totalPages || 0) > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Pagination
            count={data?.totalPages || 1}
            page={page}
            onChange={(_, p) => setPage(p)}
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'text.secondary',
                '&.Mui-selected': { background: 'rgba(99,102,241,0.2)', color: 'primary.light' },
              },
            }}
          />
        </Box>
      )}
    </PageWrapper>
  );
};
