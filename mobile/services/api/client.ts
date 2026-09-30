import type { TokenPair } from '@shared/types/api';

import { config } from '@/services/config';

import { ApiError, NetworkError } from './errors';
import { tokenStore } from './tokens';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Attach the bearer token and transparently refresh it. Defaults to true. */
  auth?: boolean;
  signal?: AbortSignal;
}

let onSessionExpired: (() => void) | null = null;

/** Registered by the auth store: called when the refresh token is rejected. */
export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

async function rawFetch(path: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller);
  try {
    return await fetch(`${config.apiUrl}${path}`, { ...init, signal: controller.signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new NetworkError();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

let inflightRefresh: Promise<string> | null = null;

/**
 * Exchange the refresh token for a new pair. Concurrent callers share one
 * request: refresh tokens rotate, so parallel refreshes would trip the
 * server's reuse detection and revoke the session.
 */
export function refreshAccessToken(): Promise<string> {
  inflightRefresh ??= (async () => {
    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError(401, 'unauthorized', 'Not signed in');
    }
    const response = await rawFetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
      const error = await ApiError.fromResponse(response);
      if (response.status === 401) {
        await tokenStore.clear();
        onSessionExpired?.();
      }
      throw error;
    }
    const pair = (await response.json()) as TokenPair;
    await tokenStore.save(pair);
    return pair.access_token;
  })().finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
}

async function send(path: string, options: RequestOptions, accessToken: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return rawFetch(
    path,
    {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    },
    options.signal,
  );
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth ?? true;
  let token: string | null = null;
  if (auth) token = tokenStore.getValidAccessToken() ?? (await refreshAccessToken());

  let response = await send(path, options, token);

  // The access token may have been revoked or expired mid-flight: refresh once.
  if (auth && response.status === 401) {
    token = await refreshAccessToken();
    response = await send(path, options, token);
  }

  if (!response.ok) throw await ApiError.fromResponse(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE', body }),
};
