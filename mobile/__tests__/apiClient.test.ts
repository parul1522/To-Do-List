import type { TokenPair } from '@shared/types/api';

jest.mock('@/services/storage/secureStorage', () => {
  const store = new Map<string, string>();
  return {
    secureStorage: {
      get: jest.fn(async (k: string) => store.get(k) ?? null),
      set: jest.fn(async (k: string, v: string) => void store.set(k, v)),
      remove: jest.fn(async (k: string) => void store.delete(k)),
    },
  };
});

jest.mock('@/services/config', () => ({ config: { apiUrl: 'http://api.test', requestTimeoutMs: 5000 } }));

import { api, setSessionExpiredHandler } from '@/services/api/client';
import { ApiError, NetworkError } from '@/services/api/errors';
import { tokenStore } from '@/services/api/tokens';

const pair = (n: number): TokenPair => ({
  access_token: `access-${n}`,
  refresh_token: `refresh-${n}`,
  token_type: 'bearer',
  expires_in: 900,
});

function json(status: number, body: unknown): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>();

beforeEach(async () => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  await tokenStore.clear();
});

it('attaches the bearer token', async () => {
  await tokenStore.save(pair(1));
  fetchMock.mockResolvedValueOnce(json(200, { id: 'me' }));

  await expect(api.get('/users/me')).resolves.toEqual({ id: 'me' });
  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url).toBe('http://api.test/users/me');
  expect((init.headers as Record<string, string>).Authorization).toBe('Bearer access-1');
});

it('refreshes once on 401 and retries the request', async () => {
  await tokenStore.save(pair(1));
  fetchMock
    .mockResolvedValueOnce(json(401, { error: { code: 'invalid_token', message: 'expired' } }))
    .mockResolvedValueOnce(json(200, pair(2)))
    .mockResolvedValueOnce(json(200, { ok: true }));

  await expect(api.get('/users/me')).resolves.toEqual({ ok: true });
  expect(fetchMock.mock.calls[1]![0]).toBe('http://api.test/auth/refresh');
  expect(JSON.parse(fetchMock.mock.calls[1]![1].body as string)).toEqual({ refresh_token: 'refresh-1' });
  expect((fetchMock.mock.calls[2]![1].headers as Record<string, string>).Authorization).toBe('Bearer access-2');
  expect(await tokenStore.getRefreshToken()).toBe('refresh-2');
});

it('shares a single refresh between concurrent requests', async () => {
  // Persist only a refresh token (fresh app launch: no access token in memory).
  await tokenStore.save({ ...pair(1), expires_in: 0 });
  fetchMock.mockImplementation(async (url) =>
    url.endsWith('/auth/refresh') ? json(200, pair(2)) : json(200, { url }),
  );

  await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);
  const refreshCalls = fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'));
  expect(refreshCalls).toHaveLength(1);
});

it('clears the session when the refresh token is rejected', async () => {
  const onExpired = jest.fn();
  setSessionExpiredHandler(onExpired);
  await tokenStore.save({ ...pair(1), expires_in: 0 });
  fetchMock.mockResolvedValueOnce(json(401, { error: { code: 'refresh_token_reused', message: 'nope' } }));

  await expect(api.get('/users/me')).rejects.toBeInstanceOf(ApiError);
  expect(onExpired).toHaveBeenCalledTimes(1);
  expect(await tokenStore.getRefreshToken()).toBeNull();
});

it('keeps the session when offline', async () => {
  const onExpired = jest.fn();
  setSessionExpiredHandler(onExpired);
  await tokenStore.save({ ...pair(1), expires_in: 0 });
  fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

  await expect(api.get('/users/me')).rejects.toBeInstanceOf(NetworkError);
  expect(onExpired).not.toHaveBeenCalled();
  expect(await tokenStore.getRefreshToken()).toBe('refresh-1');
});

it('surfaces the API error envelope', async () => {
  fetchMock.mockResolvedValueOnce(
    json(409, { error: { code: 'email_taken', message: 'An account with this email already exists' } }),
  );
  await expect(api.post('/auth/register', {}, { auth: false })).rejects.toMatchObject({
    status: 409,
    code: 'email_taken',
    message: 'An account with this email already exists',
  });
});
