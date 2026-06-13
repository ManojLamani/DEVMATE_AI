import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const [totalRepos, repoData, allLanguages, allContributors] = await Promise.all([
    prisma.repository.count({ where: { userId } }),
    prisma.repository.findMany({
      where: { userId },
      select: { openIssues: true, stars: true, forks: true, fullName: true, name: true },
    }),
    prisma.language.findMany({
      where: { repository: { userId } },
      select: { name: true, bytes: true },
    }),
    prisma.contributor.findMany({
      where: { repository: { userId } },
      select: { githubId: true },
      distinct: ['githubId'],
    }),
  ]);

  const totalIssues = repoData.reduce((sum, r) => sum + r.openIssues, 0);
  const totalStars = repoData.reduce((sum, r) => sum + r.stars, 0);
  const totalForks = repoData.reduce((sum, r) => sum + r.forks, 0);
  const totalContributors = allContributors.length;

  const languageMap: Record<string, number> = {};
  for (const l of allLanguages) {
    languageMap[l.name] = (languageMap[l.name] || 0) + l.bytes;
  }
  const totalBytes = Object.values(languageMap).reduce((a, b) => a + b, 0);
  const topLanguages = Object.entries(languageMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
    }));

  const recentRepos = await prisma.repository.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: { languages: { take: 3 } },
  });

  res.json({
    success: true,
    data: {
      stats: { totalRepos, totalIssues, totalContributors, totalStars, totalForks },
      topLanguages,
      recentRepos,
    },
  });
};
