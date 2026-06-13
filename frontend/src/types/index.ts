export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export interface Language {
  id: string;
  name: string;
  bytes: number;
  percentage: number;
  color: string | null;
}

export interface Contributor {
  id: string;
  login: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  contributions: number;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: string[];
  author: string | null;
  authorAvatar: string | null;
  comments: number;
  githubCreatedAt: string | null;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  state: string;
  draft: boolean;
  labels: string[];
  author: string | null;
  authorAvatar: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  mergedAt: string | null;
  githubCreatedAt: string | null;
}

export interface Branch {
  id: string;
  name: string;
  isDefault: boolean;
  isProtected: boolean;
}

export interface CommitActivity {
  id: string;
  week: string;
  total: number;
  days: number[];
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  size: number;
  defaultBranch: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  license: string | null;
  topics: string[];
  pushedAt: string | null;
  githubCreatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  languages: Language[];
  contributors?: Contributor[];
  issues?: Issue[];
  pullRequests?: PullRequest[];
  branches?: Branch[];
  commits?: CommitActivity[];
  _count?: { contributors: number; issues: number };
}

export interface DashboardStats {
  stats: {
    totalRepos: number;
    totalIssues: number;
    totalContributors: number;
    totalStars: number;
    totalForks: number;
  };
  topLanguages: Array<{ name: string; bytes: number; percentage: number }>;
  recentRepos: Repository[];
}

export interface AnalyticsData {
  overview: {
    stars: number;
    forks: number;
    openIssues: number;
    watchers: number;
    size: number;
    branchCount: number;
  };
  pullRequests: { open: number; closed: number; merged: number };
  commitTrend: Array<{ week: string; commits: number }>;
  issuesByLabel: Array<{ label: string; count: number }>;
  topContributors: Contributor[];
  languages: Language[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
