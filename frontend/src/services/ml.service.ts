import api from './api';

// ─── Module 1: Issue Difficulty ──────────────────────────────────────────────

export interface IssueDifficultyResult {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  confidence: number;
  probabilities: { Easy: number; Medium: number; Hard: number };
  rf_prediction: string;
  xgb_prediction: string;
  feature_importance: Record<string, number>;
}

export const predictIssueDifficulty = (issueId: string) =>
  api.post<{ success: boolean; data: IssueDifficultyResult }>(`/ml/issues/${issueId}/predict-difficulty`);

// ─── Module 2: Contribution Success ──────────────────────────────────────────

export interface ContributionSuccessResult {
  success_probability: number;
  factors: {
    skill_match: number;
    experience_level: number;
    domain_alignment: number;
    difficulty_penalty: number;
  };
  recommendation: string;
  skill_gaps: string[];
}

export const predictContributionSuccess = (payload: {
  user_skills: string[];
  repo_category?: string;
  issue_difficulty?: string;
}) =>
  api.post<{ success: boolean; data: ContributionSuccessResult }>('/ml/contribution/predict', payload);

// ─── Module 3: Repository Clustering ─────────────────────────────────────────

export interface RepoClusterResult {
  repo_id: string | null;
  cluster: string;
  confidence: number;
  pca_x: number;
  pca_y: number;
  all_scores: Record<string, number>;
}

export const clusterRepository = (repoId: string) =>
  api.post<{ success: boolean; data: RepoClusterResult }>(`/ml/repositories/${repoId}/cluster`);

export const clusterAllRepositories = () =>
  api.post<{ success: boolean; data: RepoClusterResult[]; total: number }>('/ml/repositories/cluster-all');

export const getClusterVisualization = () =>
  api.get<{ success: boolean; data: { model_viz: any[]; user_repos: any[] } }>('/ml/cluster/visualization');

// ─── Module 4: Issue Clustering ───────────────────────────────────────────────

export interface IssueClusterResult {
  issue_id: string | null;
  category: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export const clusterRepoIssues = (repoId: string) =>
  api.post<{ success: boolean; data: IssueClusterResult[]; total: number }>(`/ml/repositories/${repoId}/cluster-issues`);

// ─── Module 5: Repository Explainer ──────────────────────────────────────────

export interface RepoExplanation {
  summary: string;
  type: string;
  architecture: string;
  tech_stack: string[];
  important_folders: Array<{ path: string; purpose: string }>;
  starting_files: Array<{ file: string; reason: string }>;
  complexity: string;
  contribution_tips: string[];
}

export const explainRepository = (repoId: string) =>
  api.post<{ success: boolean; data: RepoExplanation }>(`/ml/repositories/${repoId}/explain`);

// ─── Module 6: Recommendations ────────────────────────────────────────────────

export interface Recommendations {
  top_repositories: Array<{
    id: string;
    name: string;
    full_name: string;
    cluster: string;
    score: number;
    match_percentage: number;
    reasons: string[];
  }>;
  top_issues: Array<{
    id: string;
    title: string;
    difficulty: string;
    score: number;
    match_percentage: number;
    reasons: string[];
  }>;
  learning_roadmap: {
    category: string;
    steps: string[];
    skill_gaps: string[];
    next_milestone: string;
  };
  profile_summary: {
    dominant_category: string;
    experience_level: string;
    skill_count: number;
    contribution_count: number;
  };
}

export const getRecommendations = () =>
  api.get<{ success: boolean; data: Recommendations }>('/ml/recommendations');

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserMLProfile {
  id: string;
  userId: string;
  skills: string[];
  preferredLanguages: string[];
  contributionCount: number;
  dominantCategory: string | null;
  experienceLevel: string | null;
}

export const getUserMLProfile = () =>
  api.get<{ success: boolean; data: UserMLProfile | null }>('/ml/profile');

export const updateUserMLProfile = (data: Partial<Pick<UserMLProfile, 'skills' | 'preferredLanguages' | 'contributionCount'>>) =>
  api.put<{ success: boolean; data: UserMLProfile }>('/ml/profile', data);

// ─── ML Dashboard ─────────────────────────────────────────────────────────────

export interface MLDashboardData {
  issue_difficulties: Array<{ difficulty: string; count: number; avg_confidence: number }>;
  issue_categories: Array<{ category: string; count: number; avg_confidence: number }>;
  repo_clusters: Array<{ repo_name: string; cluster: string; confidence: number; pca_x: number | null; pca_y: number | null }>;
}

export const getMLDashboard = () =>
  api.get<{ success: boolean; data: MLDashboardData }>('/ml/dashboard');
