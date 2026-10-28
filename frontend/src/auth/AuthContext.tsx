import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setToken, setUnauthorizedHandler } from '../api/client';
import { api } from '../api/endpoints';
import type { User } from '../api/types';

interface Session {
  token: string;
  user: User;
}

interface AuthValue {
  user: User | null;
  expired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'metaahorro.session';
const AuthContext = createContext<AuthValue | null>(null);

function tokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    return tokenExpired(session.token) ? null : session;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const stored = readSession();
    setToken(stored?.token ?? null);
    return stored;
  });
  const [expired, setExpired] = useState(false);

  const apply = useCallback((next: Session | null) => {
    setToken(next?.token ?? null);
    saveSession(next);
    setSession(next);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setExpired(true);
      apply(null);
    });
  }, [apply]);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      expired,
      login: async (email, password) => {
        const result = await api.login({ email, password });
        setExpired(false);
        apply(result);
      },
      register: async (name, email, password) => {
        await api.register({ name, email, password });
        const result = await api.login({ email, password });
        setExpired(false);
        apply(result);
      },
      logout: () => {
        setExpired(false);
        apply(null);
      },
    }),
    [session, expired, apply],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return value;
}
