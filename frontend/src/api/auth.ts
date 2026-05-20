import { api } from './client';
import type { AuthUser } from '../types/api';

export interface LoginInput {
  email: string;
  password: string;
  displayName?: string;
}

export const authApi = {
  login: (input: LoginInput) => api.post<{ ok: true; user: AuthUser }>('/auth/login', input),
  logout: () => api.post<{ ok: true }>('/auth/logout'),
  me: () => api.get<AuthUser>('/auth/me'),
};
