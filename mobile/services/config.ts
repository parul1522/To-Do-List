import Constants from 'expo-constants';

const DEFAULT_PORT = 8000;

/**
 * Resolve the API base URL.
 *
 * 1. `EXPO_PUBLIC_API_URL` wins when set (staging/production builds).
 * 2. In development, reuse the host Metro is served from, so a physical
 *    device on the same Wi-Fi reaches the API without extra configuration.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (__DEV__ && host) return `http://${host}:${DEFAULT_PORT}/api/v1`;

  return `http://localhost:${DEFAULT_PORT}/api/v1`;
}

export const config = {
  apiUrl: resolveApiUrl(),
  requestTimeoutMs: 15_000,
} as const;
