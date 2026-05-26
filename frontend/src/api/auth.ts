import { api } from './client';
import type { AuthUser } from '../types/api';

export interface LoginInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginResult {
  ok: true;
  twofaRequired: boolean;
  user?: AuthUser;
}

export interface TwoFaSetup {
  otpauthUrl: string;
  qrDataUrl: string;
  secret: string;
  backupCodes: string[];
}

export const authApi = {
  login: (input: LoginInput) => api.post<LoginResult>('/auth/login', input),
  loginTwoFa: (code: string) => api.post<{ ok: true; user: AuthUser }>('/auth/2fa/login', { code }),
  logout: () => api.post<{ ok: true }>('/auth/logout'),
  me: () => api.get<AuthUser & { twofaEnabled: boolean }>('/auth/me'),

  twofaStatus: () => api.get<{ enabled: boolean }>('/auth/2fa/status'),
  twofaSetup: () => api.post<TwoFaSetup>('/auth/2fa/setup'),
  twofaConfirm: (code: string) => api.post<{ ok: true }>('/auth/2fa/confirm', { code }),
  twofaDisable: (code: string) => api.post<{ ok: true }>('/auth/2fa/disable', { code }),
};
