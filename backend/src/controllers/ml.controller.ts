import { Response } from 'express';
import axios from 'axios';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../types';

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const mlClient = axios.create({ baseURL: ML_URL, timeout: 30000 });

// ─── Module 1: Issue Difficulty ──────────────────────────────────────────────

export const predictIssueDifficulty = async (req: AuthRequest, res: Response): Promise<void> => {
  const { issueId } = req.params;

  const issue = await prisma.issue.findFirst({
    where: { id: issueId },
    include: { repository: { select: { stars: true, size: true, userId: true } } },
  });
  if (!issue) throw new AppError('Issue not found', 404);
  if (issue.repository.userId !== req.user!.id) throw new AppError('Unauthorized', 403);

  const { data } = await mlClient.post('/predict/issue-difficulty', {
    title: issue.title,
    description: issue.body || '',
    labels: issue.labels,
    num_comments: issue.comments,
    repo_stars: issue.repository.stars,
    repo_size: issue.repository.size,
  });

  const result = data.data;

  await prisma.issueMLResult.upsert({
    where: { issueId },
    update: {
      difficulty: result.difficulty,
      confidence: result.confidence,
      probabilities: result.probabilities,
      rfPrediction: result.rf_prediction,
      xgbPrediction: result.xgb_prediction,
      featureImportance: result.feature_importance,
    },
    create: {
      issueId,
      difficulty: result.difficulty,
      confidence: result.confidence,
      probabilities: result.probabilities,
      rfPrediction: result.rf_prediction,
      xgbPrediction: result.xgb_prediction,
      featureImportance: result.feature_importance,
    },
  });

  res.json({ success: true, data: result });
};

// ─── Module 2: Contribution Success ──────────────────────────────────────────

export const predictContributionSuccess = async (req: AuthRequest, res: Response): Promise<void> => {
  const { user_skills, repo_category, issue_difficulty } = req.body;

  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.user!.id },
  });
  const contributions = profile?.contributionCount ?? 0;

  const { data } = await mlClient.post('/predict/contribution-success', {
    user_skills: user_skills || profile?.skills || [],
    previous_contributions: contributions,
    repo_category: repo_category || 'Full Stack',
    issue_difficulty: issue_difficulty || 'Medium',
  });

  res.json({ success: true, data: data.data });
};

// ─── Module 3: Repository Clustering ─────────────────────────────────────────

export const clusterRepository = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const repo = await prisma.repository.findFirst({
    where: { id, userId: req.user!.id },
    include: { languages: true },
  });
  if (!repo) throw new AppError('Repository not found', 404);

  const languages: Record<string, number> = {};
  for (const lang of repo.languages) {
    languages[lang.name] = lang.percentage;
  }

  const { data } = await mlClient.post('/cluster/repository', {
    repo_id: repo.id,
    name: repo.name,
    description: repo.description || '',
    topics: repo.topics,
    languages,
    stars: repo.stars,
    size: repo.size,
    open_issues: repo.openIssues,
  });

  const result = data.data;

  await prisma.repositoryClusterResult.upsert({
    where: { repositoryId: id },
    update: {
      cluster: result.cluster,
      confidence: result.confidence,
      allScores: result.all_scores,
      pcaX: result.pca_x,
      pcaY: result.pca_y,
    },
    create: {
      repositoryId: id,
      cluster: result.cluster,
      confidence: result.confidence,
      allScores: result.all_scores,
      pcaX: result.pca_x,
      pcaY: result.pca_y,
    },
  });

  res.json({ success: true, data: result });
};

export const clusterAllRepositories = async (req: AuthRequest, res: Response): Promise<void> => {
  const repos = await prisma.repository.findMany({
    where: { userId: req.user!.id },
    include: { languages: true },
  });

  const payload = repos.map((repo) => {
    const languages: Record<string, number> = {};
    for (const lang of repo.languages) languages[lang.name] = lang.percentage;
    return {
      repo_id: repo.id,
      name: repo.name,
      description: repo.description || '',
      topics: repo.topics,
      languages,
      stars: repo.stars,
      size: repo.size,
      open_issues: repo.openIssues,
    };
  });

  const { data } = await mlClient.post('/cluster/repositories', { repositories: payload });
  const results: any[] = data.data;

  for (const result of results) {
    if (!result.repo_id) continue;
    await prisma.repositoryClusterResult.upsert({
      where: { repositoryId: result.repo_id },
      update: {
        cluster: result.cluster,
        confidence: result.confidence,
        allScores: result.all_scores,
        pcaX: result.pca_x,
        pcaY: result.pca_y,
      },
      create: {
        repositoryId: result.repo_id,
        cluster: result.cluster,
        confidence: result.confidence,
        allScores: result.all_scores,
        pcaX: result.pca_x,
        pcaY: result.pca_y,
      },
    });
  }

  res.json({ success: true, data: results, total: results.length });
};

export const getClusterVisualization = async (req: AuthRequest, res: Response): Promise<void> => {
  const { data } = await mlClient.get('/cluster/visualization');

  const dbClusters = await prisma.repositoryClusterResult.findMany({
    where: { repository: { userId: req.user!.id } },
    include: { repository: { select: { name: true, fullName: true, stars: true } } },
  });

  res.json({ success: true, data: { model_viz: data.data, user_repos: dbClusters } });
};

// ─── Module 4: Issue Clustering ───────────────────────────────────────────────

export const clusterRepoIssues = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const repo = await prisma.repository.findFirst({
    where: { id, userId: req.user!.id },
    include: { issues: true },
  });
  if (!repo) throw new AppError('Repository not found', 404);

  const issuePayload = repo.issues.map((issue) => ({
    issue_id: issue.id,
    title: issue.title,
    body: issue.body || '',
    labels: issue.labels,
  }));

  const { data } = await mlClient.post('/cluster/issues', { issues: issuePayload });
  const results: any[] = data.data;

  for (const result of results) {
    if (!result.issue_id) continue;
    await prisma.issueClusterResult.upsert({
      where: { issueId: result.issue_id },
      update: {
        category: result.category,
        confidence: result.confidence,
        probabilities: result.probabilities,
      },
      create: {
        issueId: result.issue_id,
        category: result.category,
        confidence: result.confidence,
        probabilities: result.probabilities,
      },
    });
  }

  res.json({ success: true, data: results, total: results.length });
};

// ─── Module 5: Repository Explainer ──────────────────────────────────────────

export const explainRepository = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const repo = await prisma.repository.findFirst({
    where: { id, userId: req.user!.id },
    include: { languages: true },
  });
  if (!repo) throw new AppError('Repository not found', 404);

  const languages: Record<string, number> = {};
  for (const lang of repo.languages) languages[lang.name] = lang.percentage;

  const { data } = await mlClient.post('/explain/repository', {
    name: repo.name,
    description: repo.description || '',
    topics: repo.topics,
    languages,
    stars: repo.stars,
    forks: repo.forks,
  });

  const explanation = data.data;

  await prisma.repositoryClusterResult.upsert({
    where: { repositoryId: id },
    update: { explanation },
    create: {
      repositoryId: id,
      cluster: explanation.type || 'Unknown',
      confidence: 1.0,
      allScores: {},
      explanation,
    },
  });

  res.json({ success: true, data: explanation });
};

// ─── Module 6: Recommendations ────────────────────────────────────────────────

export const getRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await prisma.userProfile.findUnique({ where: { userId: req.user!.id } });

  const repos = await prisma.repository.findMany({
    where: { userId: req.user!.id },
    include: { languages: true, clusterResult: true },
    take: 50,
  });

  const issues = await prisma.issue.findMany({
    where: { repository: { userId: req.user!.id }, state: 'open' },
    include: {
      mlResult: true,
      clusterResult: true,
      repository: { select: { clusterResult: { select: { cluster: true } } } },
    },
    take: 100,
  });

  const repoPayload = repos.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.fullName,
    stars: r.stars,
    topics: r.topics,
    languages: Object.fromEntries(r.languages.map((l) => [l.name, l.percentage])),
    cluster: r.clusterResult?.cluster,
  }));

  const issuePayload = issues.map((i) => ({
    id: i.id,
    title: i.title,
    labels: i.labels,
    // repo_cluster is the repository's tech cluster (Frontend/Backend/etc), not the issue type
    repo_cluster: i.repository?.clusterResult?.cluster ?? null,
  }));

  const { data } = await mlClient.post('/recommend', {
    user_skills: profile?.skills || [],
    contribution_count: profile?.contributionCount || 0,
    preferred_languages: profile?.preferredLanguages || [],
    repositories: repoPayload,
    issues: issuePayload,
  });

  res.json({ success: true, data: data.data });
};

// ─── User Profile (skills management) ────────────────────────────────────────

export const upsertUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { skills, preferredLanguages, contributionCount } = req.body;

  const profile = await prisma.userProfile.upsert({
    where: { userId: req.user!.id },
    update: {
      skills: skills ?? undefined,
      preferredLanguages: preferredLanguages ?? undefined,
      contributionCount: contributionCount ?? undefined,
    },
    create: {
      userId: req.user!.id,
      skills: skills || [],
      preferredLanguages: preferredLanguages || [],
      contributionCount: contributionCount || 0,
    },
  });

  res.json({ success: true, data: profile });
};

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await prisma.userProfile.findUnique({ where: { userId: req.user!.id } });
  res.json({ success: true, data: profile });
};

// ─── Analytics Dashboard ───────────────────────────────────────────────────────

export const getMLDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const [issueDifficulties, issueCategories, repoClusters] = await Promise.all([
    prisma.issueMLResult.groupBy({
      by: ['difficulty'],
      where: { issue: { repository: { userId } } },
      _count: { difficulty: true },
      _avg: { confidence: true },
    }),
    prisma.issueClusterResult.groupBy({
      by: ['category'],
      where: { issue: { repository: { userId } } },
      _count: { category: true },
      _avg: { confidence: true },
    }),
    prisma.repositoryClusterResult.findMany({
      where: { repository: { userId } },
      include: { repository: { select: { name: true, stars: true } } },
    }),
  ]);

  res.json({
    success: true,
    data: {
      issue_difficulties: issueDifficulties.map((d) => ({
        difficulty: d.difficulty,
        count: d._count.difficulty,
        avg_confidence: Math.round((d._avg.confidence || 0) * 100),
      })),
      issue_categories: issueCategories.map((c) => ({
        category: c.category,
        count: c._count.category,
        avg_confidence: Math.round((c._avg.confidence || 0) * 100),
      })),
      repo_clusters: repoClusters.map((r) => ({
        repo_name: r.repository.name,
        cluster: r.cluster,
        confidence: Math.round(r.confidence * 100),
        pca_x: r.pcaX,
        pca_y: r.pcaY,
      })),
    },
  });
};
