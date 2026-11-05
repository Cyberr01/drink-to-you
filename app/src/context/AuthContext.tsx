import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { setAuthToken, setUnauthorizedHandler } from '../services/api';
import { authService } from '../services/authService';
import { cancelReminders } from '../services/notificationService';
import { storage } from '../services/storage';
import { AuthResponse, User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoadingSession: boolean;
  needsOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const startSession = useCallback(async ({ user: loggedUser, token }: AuthResponse) => {
    await storage.setToken(token);
    setAuthToken(token);
    setNeedsOnboarding(!(await storage.isOnboarded(loggedUser.id)));
    setUser(loggedUser);
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setNeedsOnboarding(false);
    await storage.clearSession();
    await cancelReminders().catch(() => undefined);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await storage.getToken();
        if (!token) return;
        setAuthToken(token);
        const { user: restoredUser } = await authService.me();
        setNeedsOnboarding(!(await storage.isOnboarded(restoredUser.id)));
        setUser(restoredUser);
      } catch {
        await signOut();
      } finally {
        setIsLoadingSession(false);
      }
    }
    restoreSession();
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoadingSession,
      needsOnboarding,
      signIn: async (email, password) => startSession(await authService.login(email, password)),
      signUp: async (name, email, password) =>
        startSession(await authService.register(name, email, password)),
      signOut,
      completeOnboarding: async () => {
        if (user) await storage.setOnboarded(user.id);
        setNeedsOnboarding(false);
      },
    }),
    [user, isLoadingSession, needsOnboarding, startSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
