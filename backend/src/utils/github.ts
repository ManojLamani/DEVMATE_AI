import axios from 'axios';
import {
  GitHubRepo,
  GitHubContributor,
  GitHubLanguages,
  GitHubIssue,
  GitHubPullRequest,
  GitHubBranch,
  GitHubCommitActivity,
} from '../types';

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
  timeout: 15000,
});

export const parseRepoUrl = (url: string): { owner: string; repo: string } | null => {
  const patterns = [
    /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/,
    /^([^/]+)\/([^/]+)$/,
  ];
  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) return { owner: match[1], repo: match[2] };
  }
  return null;
};

export const fetchRepoInfo = async (owner: string, repo: string): Promise<GitHubRepo> => {
  const { data } = await githubApi.get<GitHubRepo>(`/repos/${owner}/${repo}`);
  return data;
};

export const fetchContributors = async (owner: string, repo: string): Promise<GitHubContributor[]> => {
  try {
    const { data } = await githubApi.get<GitHubContributor[]>(
      `/repos/${owner}/${repo}/contributors?per_page=30`
    );
    return data;
  } catch {
    return [];
  }
};

export const fetchLanguages = async (owner: string, repo: string): Promise<GitHubLanguages> => {
  try {
    const { data } = await githubApi.get<GitHubLanguages>(`/repos/${owner}/${repo}/languages`);
    return data;
  } catch {
    return {};
  }
};

export const fetchIssues = async (owner: string, repo: string): Promise<GitHubIssue[]> => {
  try {
    const { data } = await githubApi.get<GitHubIssue[]>(
      `/repos/${owner}/${repo}/issues?state=open&per_page=50`
    );
    return data.filter(issue => !issue.pull_request);
  } catch {
    return [];
  }
};

export const fetchPullRequests = async (owner: string, repo: string): Promise<GitHubPullRequest[]> => {
  try {
    const { data } = await githubApi.get<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?state=all&per_page=30`
    );
    return data;
  } catch {
    return [];
  }
};

export const fetchBranches = async (owner: string, repo: string): Promise<GitHubBranch[]> => {
  try {
    const { data } = await githubApi.get<GitHubBranch[]>(
      `/repos/${owner}/${repo}/branches?per_page=50`
    );
    return data;
  } catch {
    return [];
  }
};

export const fetchCommitActivity = async (owner: string, repo: string): Promise<GitHubCommitActivity[]> => {
  try {
    const { data } = await githubApi.get<GitHubCommitActivity[]>(
      `/repos/${owner}/${repo}/stats/commit_activity`
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
