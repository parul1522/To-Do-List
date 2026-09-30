import type { TokenPair } from '@shared/types/api';

import { secureStorage } from '@/services/storage/secureStorage';

const REFRESH_TOKEN_KEY = 'mneme.refreshToken';
/** Refresh slightly early so requests never race the expiry. */
const EXPIRY_SKEW_MS = 30_000;

/**
 * The access token lives only in memory; the long-lived refresh token is
 * persisted in secure storage so sessions survive app restarts.
 */
let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let refreshToken: string | null = null;
let refreshTokenLoaded = false;

export const tokenStore = {
  async save(pair: TokenPair): Promise<void> {
    accessToken = pair.access_token;
    accessTokenExpiresAt = Date.now() + pair.expires_in * 1000;
    refreshToken = pair.refresh_token;
    refreshTokenLoaded = true;
    await secureStorage.set(REFRESH_TOKEN_KEY, pair.refresh_token);
  },

  /** Returns the access token if it is still comfortably valid. */
  getValidAccessToken(): string | null {
    if (accessToken && Date.now() < accessTokenExpiresAt - EXPIRY_SKEW_MS) return accessToken;
    return null;
  },

  async getRefreshToken(): Promise<string | null> {
    if (!refreshTokenLoaded) {
      refreshToken = await secureStorage.get(REFRESH_TOKEN_KEY);
      refreshTokenLoaded = true;
    }
    return refreshToken;
  },

  async clear(): Promise<void> {
    accessToken = null;
    accessTokenExpiresAt = 0;
    refreshToken = null;
    refreshTokenLoaded = true;
    await secureStorage.remove(REFRESH_TOKEN_KEY);
  },
};
