import NetInfo from '@react-native-community/netinfo';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/auth-storage';
import { changePassword, getProfile, login as loginApi } from '@/modules/api/auth-api';
import type { AuthenticatedUser } from '@/modules/auth/auth-types';
import { isRaTehsilRole } from '@/modules/auth/roles';
import { pendingSyncCount } from '@/modules/offline/offline-store';
import { syncOfflineQueue } from '@/modules/offline/sync-engine';

type AuthContextValue = {
  user: AuthenticatedUser | null;
  token: string | null;
  isLoading: boolean;
  isOnline: boolean;
  pendingSync: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  runSync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    setPendingSync(await pendingSyncCount());
  }, []);

  const runSync = useCallback(async () => {
    if (!token) return;
    await syncOfflineQueue(token);
    await refreshPendingCount();
  }, [token, refreshPendingCount]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable is often false on iOS simulator while fetch still works;
      // treat null/undefined as unknown (online when connected).
      const online = Boolean(
        state.isConnected &&
          state.isInternetReachable !== false,
      );
      setIsOnline(online);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isOnline && token) {
      void runSync();
    }
  }, [isOnline, token, runSync]);

  const bootstrap = useCallback(async () => {
    try {
      const stored = await getStoredToken();
      if (!stored) return;
      const profile = await getProfile(stored);
      if (!isRaTehsilRole(profile.role)) {
        await clearStoredToken();
        return;
      }
      setToken(stored);
      setUser(profile);
      await syncOfflineQueue(stored);
    } catch {
      await clearStoredToken();
    } finally {
      await refreshPendingCount();
      setIsLoading(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginApi({
        email: email.trim().toLowerCase(),
        password,
      });
      if (!isRaTehsilRole(result.user.role)) {
        throw new Error(
          'This app is only for RA E&S Tehsil field users. Use a tehsil RA account.',
        );
      }
      await setStoredToken(result.accessToken);
      setToken(result.accessToken);
      setUser(result.user);
      await syncOfflineQueue(result.accessToken);
      await refreshPendingCount();
    },
    [refreshPendingCount],
  );

  const logout = useCallback(async () => {
    await clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const profile = await getProfile(token);
    setUser(profile);
  }, [token]);

  const changeUserPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!token) return;
      await changePassword(token, { currentPassword, newPassword });
      await refreshProfile();
    },
    [token, refreshProfile],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isOnline,
      pendingSync,
      login,
      logout,
      refreshProfile,
      changeUserPassword,
      runSync,
      refreshPendingCount,
    }),
    [
      user,
      token,
      isLoading,
      isOnline,
      pendingSync,
      login,
      logout,
      refreshProfile,
      changeUserPassword,
      runSync,
      refreshPendingCount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
