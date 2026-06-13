import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../types';

export const getRepoAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const repo = await prisma.repository.findFirst({
    where: { id, userId: req.user!.id },
    include: {
      languages: true,
      contributors: { orderBy: { contributions: 'desc' }, take: 10 },
      issues: { orderBy: { githubCreatedAt: 'desc' } },
      pullRequests: { orderBy: { githubCreatedAt: 'desc' } },
      commits: { orderBy: { week: 'asc' }, take: 52 },
    },
  });

  if (!repo) throw new AppError('Repository not found', 404);

  const openPRs = repo.pullRequests.filter(pr => pr.state === 'open').length;
  const closedPRs = repo.pullRequests.filter(pr => pr.state === 'closed').length;
  const mergedPRs = repo.pullRequests.filter(pr => pr.mergedAt !== null).length;

  const commitTrend = repo.commits.map(c => ({
    week: c.week.toISOString().split('T')[0],
    commits: c.total,
  }));

  const issuesByLabel: Record<string, number> = {};
  for (const issue of repo.issues) {
    for (const label of issue.labels) {
      issuesByLabel[label] = (issuesByLabel[label] || 0) + 1;
    }
  }

  res.json({
    success: true,
    data: {
      overview: {
        stars: repo.stars,
        forks: repo.forks,
        openIssues: repo.openIssues,
        watchers: repo.watchers,
        size: repo.size,
        branchCount: await prisma.branch.count({ where: { repositoryId: id } }),
      },
      pullRequests: { open: openPRs, closed: closedPRs, merged: mergedPRs },
      commitTrend,
      issuesByLabel: Object.entries(issuesByLabel)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([label, count]) => ({ label, count })),
      topContributors: repo.contributors.slice(0, 5),
      languages: repo.languages,
    },
  });
};
