import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  predictIssueDifficulty,
  predictContributionSuccess,
  clusterRepository,
  clusterAllRepositories,
  getClusterVisualization,
  clusterRepoIssues,
  explainRepository,
  getRecommendations,
  upsertUserProfile,
  getUserProfile,
  getMLDashboard,
} from '../controllers/ml.controller';

export const mlRouter = Router();

mlRouter.use(authenticate);

// Module 1 — Issue Difficulty
mlRouter.post('/issues/:issueId/predict-difficulty', predictIssueDifficulty);

// Module 2 — Contribution Success
mlRouter.post('/contribution/predict', predictContributionSuccess);

// Module 3 — Repository Clustering
mlRouter.post('/repositories/:id/cluster', clusterRepository);
mlRouter.post('/repositories/cluster-all', clusterAllRepositories);
mlRouter.get('/cluster/visualization', getClusterVisualization);

// Module 4 — Issue Clustering
mlRouter.post('/repositories/:id/cluster-issues', clusterRepoIssues);

// Module 5 — Repo Explainer
mlRouter.post('/repositories/:id/explain', explainRepository);

// Module 6 — Recommendations
mlRouter.get('/recommendations', getRecommendations);

// User Profile
mlRouter.get('/profile', getUserProfile);
mlRouter.put('/profile', upsertUserProfile);

// Analytics Dashboard
mlRouter.get('/dashboard', getMLDashboard);
