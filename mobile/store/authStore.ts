import type { TokenPair, User } from '@shared/types/api';
import { create } from 'zustand';

import { authApi } from '@/features/auth/api';
import { profileApi } from '@/features/profile/api';
import { refreshAccessToken, setSessionExpiredHandler } from '@/services/api/client';
import { isUnauthorized } from '@/services/api/errors';
import { tokenStore } from '@/services/api/tokens';
import { queryClient } from '@/services/queryClient';
import { secureStorage } from '@/services/storage/secureStorage';

const CACHED_USER_KEY = 'mneme.user';

export type AuthStatus = 'bootstrapping' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  /** Restore a persisted session on app launch. Works offline. */
  bootstrap: () => Promise<void>;
  startSession: (user: User, tokens: TokenPair) => Promise<void>;
  setUser: (user: User) => void;
  signOut: () => Promise<void>;
  /** Local-only sign-out used when the server rejects the session. */
  clearSession: () => Promise<void>;
}

async function persistUser(user: User): Promise<void> {
  await secureStorage.set(CACHED_USER_KEY, JSON.stringify(user));
}

async function readCachedUser(): Promise<User | null> {
  const raw = await secureStorage.get(CACHED_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'bootstrapping',
  user: null,

  async bootstrap() {
    const [refreshToken, cachedUser] = await Promise.all([tokenStore.getRefreshToken(), readCachedUser()]);
    if (!refreshToken) {
      set({ status: 'signedOut', user: null });
      return;
    }

    // Optimistically restore the session so the app opens instantly, even
    // offline. The server is then asked to confirm it in the background.
    set({ status: cachedUser ? 'signedIn' : 'bootstrapping', user: cachedUser });
    try {
      await refreshAccessToken();
      const user = await profileApi.me();
      await persistUser(user);
      set({ status: 'signedIn', user });
    } catch (error) {
      if (isUnauthorized(error)) {
        await get().clearSession();
      } else if (!cachedUser) {
        // Offline on first launch after an upgrade with no cached profile:
        // there is nothing to show, so ask the user to sign in again.
        set({ status: 'signedOut', user: null });
      }
    }
  },

  async startSession(user, tokens) {
    await tokenStore.save(tokens);
    await persistUser(user);
    set({ status: 'signedIn', user });
  },

  setUser(user) {
    set({ user });
    void persistUser(user);
  },

  async signOut() {
    const refreshToken = await tokenStore.getRefreshToken();
    // Best effort: revoke server-side, but never block sign-out on the network.
    if (refreshToken) authApi.logout(refreshToken).catch(() => undefined);
    await get().clearSession();
  },

  async clearSession() {
    await Promise.all([tokenStore.clear(), secureStorage.remove(CACHED_USER_KEY)]);
    queryClient.clear();
    set({ status: 'signedOut', user: null });
  },
}));

setSessionExpiredHandler(() => {
  void useAuthStore.getState().clearSession();
});
