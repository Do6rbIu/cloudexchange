import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi, type LoginInput } from '../api/auth';
import { api } from '../api/client';
import type { AuthUser } from '../types/api';

interface AuthContextValue {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'anonymous' | 'twofa';
  error: string | null;
  // Returns true if a 2FA challenge is now required.
  login: (input: LoginInput) => Promise<boolean>;
  completeTwoFa: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((u) => {
        if (cancelled) return;
        setUser({ email: u.email, displayName: u.displayName, role: u.role });
        setStatus('authenticated');
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 with twofaRequired means a half-finished login is pending.
        if (err?.data?.twofaRequired) {
          setStatus('twofa');
        } else {
          setUser(null);
          setStatus('anonymous');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setError(null);
    try {
      const res = await authApi.login(input);
      if (res.twofaRequired) {
        setStatus('twofa');
        return true;
      }
      if (res.user) {
        setUser(res.user);
        setStatus('authenticated');
      }
      return false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    }
  }, []);

  const completeTwoFa = useCallback(async (code: string) => {
    setError(null);
    try {
      const res = await authApi.loginTwoFa(code);
      setUser(res.user);
      setStatus('authenticated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Неверный код';
      setError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    api.resetCsrf();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo(
    () => ({ user, status, error, login, completeTwoFa, logout }),
    [user, status, error, login, completeTwoFa, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
