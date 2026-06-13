import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  size: number;
  default_branch: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  license: { name: string } | null;
  topics: string[];
  pushed_at: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface GitHubLanguages {
  [key: string]: number;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{ name: string }>;
  user: { login: string; avatar_url: string } | null;
  comments: number;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  pull_request?: unknown;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  draft: boolean;
  labels: Array<{ name: string }>;
  user: { login: string; avatar_url: string } | null;
  additions: number;
  deletions: number;
  changed_files: number;
  comments: number;
  merged_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GitHubBranch {
  name: string;
  protected: boolean;
}

export interface GitHubCommitActivity {
  week: number;
  total: number;
  days: number[];
}
