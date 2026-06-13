import { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Button, Chip, LinearProgress,
  TextField, Alert, Autocomplete, Paper, Stepper, Step, StepLabel,
  CircularProgress, Divider,
} from '@mui/material';
import {
  BookOpen, Star, GitBranch, Lightbulb,
  CheckCircle, Target, TrendingUp, User,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PageWrapper } from '../components/common/PageWrapper';
import { GlassCard } from '../components/common/GlassCard';
import {
  getRecommendations, getUserMLProfile, updateUserMLProfile,
  Recommendations,
} from '../services/ml.service';

const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Next.js',
  'Python', 'Django', 'Flask', 'FastAPI', 'Node.js', 'Express',
  'Java', 'Spring', 'Go', 'Rust', 'Ruby', 'PHP',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Prisma',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform',
  'Machine Learning', 'PyTorch', 'TensorFlow', 'scikit-learn', 'Pandas',
  'React Native', 'Flutter', 'Swift', 'Kotlin',
  'CI/CD', 'GitHub Actions', 'Jenkins', 'Ansible',
];

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: '#22d3ee', Medium: '#f59e0b', Hard: '#ef4444',
};
const CLUSTER_COLOR: Record<string, string> = {
  Frontend: '#6366f1', Backend: '#22d3ee', 'Full Stack': '#10b981',
  'AI/ML': '#f59e0b', DevOps: '#ef4444', Cloud: '#8b5cf6',
};

export const RecommendationsPage = () => {
  const qc = useQueryClient();
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [contribs, setContribs] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const { data: profileRes } = useQuery({
    queryKey: ['ml-profile'],
    queryFn: () => getUserMLProfile().then((r) => r.data),
  });

  // Sync local state when profile data loads (replaces removed onSuccess)
  useEffect(() => {
    const p = profileRes?.data;
    if (p) {
      setSkills(p.skills || []);
      setLanguages(p.preferredLanguages || []);
      setContribs(String(p.contributionCount || 0));
    }
  }, [profileRes]);

  const { data: recRes, isLoading: recLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => getRecommendations().then((r) => r.data),
    enabled: profileSaved || !!profileRes?.data,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      updateUserMLProfile({
        skills,
        preferredLanguages: languages,
        contributionCount: parseInt(contribs) || 0,
      }).then((r) => r.data),
    onSuccess: () => {
      setProfileSaved(true);
      qc.invalidateQueries({ queryKey: ['recommendations'] });
      qc.invalidateQueries({ queryKey: ['ml-profile'] });
    },
  });

  const recs: Recommendations | undefined = recRes?.data;
  const roadmap = recs?.learning_roadmap;
  const profile = recs?.profile_summary;

  return (
    <PageWrapper title="Recommendations" subtitle="Personalized AI-powered suggestions based on your skills">
      <Grid container spacing={3}>
        {/* Profile Setup */}
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
              <User size={18} style={{ color: '#6366f1' }} /> Your Developer Profile
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete
                multiple
                options={SKILL_OPTIONS}
                value={skills}
                onChange={(_, v) => setSkills(v)}
                renderInput={(params) => (
                  <TextField {...params} label="Your Skills" placeholder="Add skills..." size="small" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip {...getTagProps({ index })} key={option} label={option} size="small"
                      sx={{ bgcolor: 'rgba(99,102,241,0.15)', color: 'primary.light' }} />
                  ))
                }
              />

              <Autocomplete
                multiple
                freeSolo
                options={['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'Ruby']}
                value={languages}
                onChange={(_, v) => setLanguages(v as string[])}
                renderInput={(params) => (
                  <TextField {...params} label="Preferred Languages" placeholder="Add languages..." size="small" />
                )}
              />

              <TextField
                label="Total Contributions (GitHub)"
                type="number"
                size="small"
                value={contribs}
                onChange={(e) => setContribs(e.target.value)}
                inputProps={{ min: 0 }}
              />

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  fullWidth variant="contained"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Target size={16} />}
                >
                  {saveMutation.isPending ? 'Saving…' : 'Save & Get Recommendations'}
                </Button>
              </motion.div>
            </Box>

            {/* Profile Summary */}
            {profile && (
              <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Profile Summary</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label={profile.dominant_category} size="small" sx={{ bgcolor: `${CLUSTER_COLOR[profile.dominant_category] || '#6366f1'}22`, color: CLUSTER_COLOR[profile.dominant_category] || '#6366f1' }} />
                  <Chip label={profile.experience_level} size="small" sx={{ bgcolor: 'rgba(34,211,238,0.1)', color: '#22d3ee' }} />
                  <Chip label={`${profile.skill_count} skills`} size="small" variant="outlined" />
                </Box>
              </Box>
            )}
          </GlassCard>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12} md={8}>
          {recLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

          {!recs && !recLoading && (
            <GlassCard sx={{ p: 4, textAlign: 'center' }}>
              <Lightbulb size={40} style={{ color: '#6366f1', marginBottom: 16 }} />
              <Typography variant="h6" mb={1}>Set Up Your Profile</Typography>
              <Typography color="text.secondary">Add your skills and contributions to get personalized recommendations.</Typography>
            </GlassCard>
          )}

          {recs && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Top Repositories */}
              <GlassCard sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                  <GitBranch size={18} style={{ color: '#22d3ee' }} /> Recommended Repositories
                </Typography>
                {recs.top_repositories.length === 0 ? (
                  <Alert severity="info">No repositories analyzed yet. Analyze some repos first.</Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {recs.top_repositories.map((repo) => (
                      <motion.div key={repo.id} whileHover={{ x: 4 }}>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 2 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{repo.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{repo.full_name}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip label={repo.cluster} size="small" sx={{ bgcolor: `${CLUSTER_COLOR[repo.cluster] || '#6366f1'}22`, color: CLUSTER_COLOR[repo.cluster] || '#6366f1' }} />
                              <Chip
                                icon={<Star size={10} />}
                                label={`${repo.match_percentage}% match`}
                                size="small"
                                sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981' }}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {repo.reasons.map((r) => (
                              <Typography key={r} variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                <CheckCircle size={10} style={{ color: '#10b981' }} /> {r}
                              </Typography>
                            ))}
                          </Box>
                        </Paper>
                      </motion.div>
                    ))}
                  </Box>
                )}
              </GlassCard>

              {/* Top Issues */}
              <GlassCard sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                  <Target size={18} style={{ color: '#f59e0b' }} /> Recommended Issues to Solve
                </Typography>
                {recs.top_issues.length === 0 ? (
                  <Alert severity="info">No clustered issues yet. Run issue clustering on your repositories.</Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {recs.top_issues.map((issue) => (
                      <motion.div key={issue.id} whileHover={{ x: 4 }}>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 2 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                            <Typography variant="body2" fontWeight={500} sx={{ flex: 1, mr: 1 }}>{issue.title}</Typography>
                            <Box display="flex" gap={1}>
                              <Chip
                                label={issue.difficulty}
                                size="small"
                                sx={{ bgcolor: `${DIFFICULTY_COLOR[issue.difficulty] || '#6366f1'}22`, color: DIFFICULTY_COLOR[issue.difficulty] || '#6366f1' }}
                              />
                              <Chip
                                label={`${issue.match_percentage}% match`}
                                size="small"
                                sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981' }}
                              />
                            </Box>
                          </Box>
                        </Paper>
                      </motion.div>
                    ))}
                  </Box>
                )}
              </GlassCard>

              {/* Learning Roadmap */}
              {roadmap && (
                <GlassCard sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} mb={0.5} display="flex" alignItems="center" gap={1}>
                    <BookOpen size={18} style={{ color: '#10b981' }} /> Learning Roadmap — {roadmap.category}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" mb={2} display="block">
                    Next milestone: <strong>{roadmap.next_milestone}</strong>
                  </Typography>

                  <Stepper orientation="vertical" nonLinear>
                    {roadmap.steps.map((step, i) => (
                      <Step key={i} active={false} completed={false}>
                        <StepLabel
                          StepIconComponent={() => (
                            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="caption" fontWeight={700} color="primary.light">{i + 1}</Typography>
                            </Box>
                          )}
                        >
                          <Typography variant="body2">{step}</Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  {roadmap.skill_gaps.length > 0 && (
                    <>
                      <Divider sx={{ my: 2, borderColor: 'rgba(148,163,184,0.08)' }} />
                      <Typography variant="subtitle2" color="text.secondary" mb={1}>Skill Gaps to Address</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {roadmap.skill_gaps.map((gap) => (
                          <Chip key={gap} label={gap} size="small"
                            sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                            icon={<TrendingUp size={12} style={{ color: '#ef4444' }} />}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </GlassCard>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </PageWrapper>
  );
};
