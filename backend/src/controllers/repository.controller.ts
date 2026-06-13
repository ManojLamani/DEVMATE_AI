import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../types';
import {
  parseRepoUrl,
  fetchRepoInfo,
  fetchContributors,
  fetchLanguages,
  fetchIssues,
  fetchPullRequests,
  fetchBranches,
  fetchCommitActivity,
} from '../utils/github';

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#2b7489', Python: '#3572A5',
  Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', 'C++': '#f34b7d',
  C: '#555555', Ruby: '#701516', PHP: '#4F5D95', Swift: '#ffac45',
  Kotlin: '#F18E33', Dart: '#00B4AB', HTML: '#e34c26', CSS: '#563d7c',
  Shell: '#89e051', Dockerfile: '#384d54', Vue: '#2c3e50', Svelte: '#ff3e00',
};

const analyzeSchema = z.object({ url: z.string().url().or(z.string().regex(/^[\w-]+\/[\w-]+$/)) });

export const analyzeRepository = async (req: AuthRequest, res: Response): Promise<void> => {
  const { url } = analyzeSchema.parse(req.body);
  const parsed = parseRepoUrl(url);
  if (!parsed) throw new AppError('Invalid GitHub repository URL', 400);

  const { owner, repo } = parsed;

  const [repoInfo, contributors, languagesRaw, issues, pullRequests, branches, commitActivity] =
    await Promise.all([
      fetchRepoInfo(owner, repo),
      fetchContributors(owner, repo),
      fetchLanguages(owner, repo),
      fetchIssues(owner, repo),
      fetchPullRequests(owner, repo),
      fetchBranches(owner, repo),
      fetchCommitActivity(owner, repo),
    ]);

  const totalBytes = Object.values(languagesRaw).reduce((a, b) => a + b, 0);
  const languagesData = Object.entries(languagesRaw).map(([name, bytes]) => ({
    name,
    bytes,
    percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
    color: LANGUAGE_COLORS[name] || '#8884d8',
  }));

  const repository = await prisma.repository.upsert({
    where: { githubId: BigInt(repoInfo.id) },
    create: {
      userId: req.user!.id,
      githubId: BigInt(repoInfo.id),
      name: repoInfo.name,
      fullName: repoInfo.full_name,
      description: repoInfo.description,
      url: repoInfo.html_url,
      homepage: repoInfo.homepage,
      stars: repoInfo.stargazers_count,
      forks: repoInfo.forks_count,
      openIssues: repoInfo.open_issues_count,
      watchers: repoInfo.watchers_count,
      size: repoInfo.size,
      defaultBranch: repoInfo.default_branch,
      isPrivate: repoInfo.private,
      isFork: repoInfo.fork,
      isArchived: repoInfo.archived,
      license: repoInfo.license?.name,
      topics: repoInfo.topics,
      pushedAt: repoInfo.pushed_at ? new Date(repoInfo.pushed_at) : null,
      githubCreatedAt: repoInfo.created_at ? new Date(repoInfo.created_at) : null,
      githubUpdatedAt: repoInfo.updated_at ? new Date(repoInfo.updated_at) : null,
    },
    update: {
      name: repoInfo.name,
      fullName: repoInfo.full_name,
      description: repoInfo.description,
      stars: repoInfo.stargazers_count,
      forks: repoInfo.forks_count,
      openIssues: repoInfo.open_issues_count,
      watchers: repoInfo.watchers_count,
      size: repoInfo.size,
      topics: repoInfo.topics,
      pushedAt: repoInfo.pushed_at ? new Date(repoInfo.pushed_at) : null,
    },
  });

  await prisma.language.deleteMany({ where: { repositoryId: repository.id } });
  if (languagesData.length) {
    await prisma.language.createMany({ data: languagesData.map(l => ({ ...l, repositoryId: repository.id })) });
  }

  await prisma.contributor.deleteMany({ where: { repositoryId: repository.id } });
  if (contributors.length) {
    await prisma.contributor.createMany({
      data: contributors.map(c => ({
        repositoryId: repository.id,
        githubId: BigInt(c.id),
        login: c.login,
        avatarUrl: c.avatar_url,
        profileUrl: c.html_url,
        contributions: c.contributions,
      })),
    });
  }

  await prisma.issue.deleteMany({ where: { repositoryId: repository.id } });
  if (issues.length) {
    await prisma.issue.createMany({
      data: issues.map(i => ({
        repositoryId: repository.id,
        githubId: BigInt(i.id),
        number: i.number,
        title: i.title,
        body: i.body,
        state: i.state,
        labels: i.labels.map(l => l.name),
        author: i.user?.login,
        authorAvatar: i.user?.avatar_url,
        comments: i.comments,
        closedAt: i.closed_at ? new Date(i.closed_at) : null,
        githubCreatedAt: i.created_at ? new Date(i.created_at) : null,
        githubUpdatedAt: i.updated_at ? new Date(i.updated_at) : null,
      })),
    });
  }

  await prisma.pullRequest.deleteMany({ where: { repositoryId: repository.id } });
  if (pullRequests.length) {
    await prisma.pullRequest.createMany({
      data: pullRequests.map(pr => ({
        repositoryId: repository.id,
        githubId: BigInt(pr.id),
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        draft: pr.draft,
        labels: pr.labels.map(l => l.name),
        author: pr.user?.login,
        authorAvatar: pr.user?.avatar_url,
        additions: pr.additions || 0,
        deletions: pr.deletions || 0,
        changedFiles: pr.changed_files || 0,
        comments: pr.comments || 0,
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        githubCreatedAt: pr.created_at ? new Date(pr.created_at) : null,
        githubUpdatedAt: pr.updated_at ? new Date(pr.updated_at) : null,
      })),
    });
  }

  await prisma.branch.deleteMany({ where: { repositoryId: repository.id } });
  if (branches.length) {
    await prisma.branch.createMany({
      data: branches.map(b => ({
        repositoryId: repository.id,
        name: b.name,
        isDefault: b.name === repoInfo.default_branch,
        isProtected: b.protected,
      })),
    });
  }

  await prisma.commitActivity.deleteMany({ where: { repositoryId: repository.id } });
  if (commitActivity.length) {
    await prisma.commitActivity.createMany({
      data: commitActivity.map(ca => ({
        repositoryId: repository.id,
        week: new Date(ca.week * 1000),
        total: ca.total,
        days: ca.days,
      })),
    });
  }

  const full = await prisma.repository.findUnique({
    where: { id: repository.id },
    include: {
      languages: true,
      contributors: { orderBy: { contributions: 'desc' }, take: 10 },
      issues: { orderBy: { githubCreatedAt: 'desc' }, take: 20 },
      pullRequests: { orderBy: { githubCreatedAt: 'desc' }, take: 20 },
      branches: true,
      commits: { orderBy: { week: 'desc' }, take: 52 },
    },
  });

  res.json({ success: true, data: { repository: full } });
};

export const getRepositories = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [repositories, total] = await Promise.all([
    prisma.repository.findMany({
      where: { userId: req.user!.id },
      include: { languages: true, _count: { select: { contributors: true, issues: true } } },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.repository.count({ where: { userId: req.user!.id } }),
  ]);

  res.json({ success: true, data: { repositories, total, page, totalPages: Math.ceil(total / limit) } });
};

export const getRepository = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const repository = await prisma.repository.findFirst({
    where: { id, userId: req.user!.id },
    include: {
      languages: true,
      contributors: { orderBy: { contributions: 'desc' }, take: 10 },
      issues: { orderBy: { githubCreatedAt: 'desc' }, take: 30 },
      pullRequests: { orderBy: { githubCreatedAt: 'desc' }, take: 30 },
      branches: true,
      commits: { orderBy: { week: 'desc' }, take: 52 },
    },
  });
  if (!repository) throw new AppError('Repository not found', 404);
  res.json({ success: true, data: { repository } });
};

export const deleteRepository = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const repo = await prisma.repository.findFirst({ where: { id, userId: req.user!.id } });
  if (!repo) throw new AppError('Repository not found', 404);
  await prisma.repository.delete({ where: { id } });
  res.json({ success: true, message: 'Repository deleted' });
};
