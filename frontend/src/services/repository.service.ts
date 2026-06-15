import api from './api';
import { ApiResponse, Repository, DashboardStats, AnalyticsData } from '../types';

export const repositoryService = {
  analyze: (url: string) =>
    api.post<ApiResponse<{ repository: Repository }>>('/repositories/analyze', { url }),

  getAll: (page = 1, limit = 10) =>
    api.get<ApiResponse<{ repositories: Repository[]; total: number; page: number; totalPages: number }>>(
      `/repositories?page=${page}&limit=${limit}`
    ),

  getById: (id: string) =>
    api.get<ApiResponse<{ repository: Repository }>>(`/repositories/${id}`),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/repositories/${id}`),

  getDashboardStats: () =>
    api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),

  getAnalytics: (id: string) =>
    api.get<ApiResponse<AnalyticsData>>(`/analytics/repository/${id}`),

  predictIssueDifficulty: (issueId: string) =>
    api.post(`/ml/issues/${issueId}/predict-difficulty`),

  clusterIssues: (repoId: string) =>
    api.post(`/ml/repositories/${repoId}/cluster-issues`),

  clusterRepository: (repoId: string) =>
    api.post(`/ml/repositories/${repoId}/cluster`),
};
