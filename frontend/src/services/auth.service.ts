import api from './api';
import { ApiResponse, User } from '../types';

export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data),

  googleAuth: (credential: string) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/google', { credential }),

  getMe: () =>
    api.get<ApiResponse<{ user: User }>>('/auth/me'),
};
