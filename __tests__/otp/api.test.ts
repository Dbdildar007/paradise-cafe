import { API_CONFIG } from '../../src/config/api';
import { createAuthApi } from '../../src/services/api/authApi';
import { ApiError, postJson } from '../../src/services/api/httpClient';
import { withRetry } from '../../src/services/api/retry';
import { PROFILE } from '../../jest/otpTestUtils';

const mockFetch = (impl: (...a: unknown[]) => unknown) => {
  (globalThis as { fetch?: unknown }).fetch = jest.fn(impl);
  return (globalThis as unknown as { fetch: jest.Mock }).fetch;
};
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const bad = (status: number, body: unknown = {}) => ({ ok: false, status, json: async () => body });

describe('postJson', () => {
  it('rejects non-HTTPS URLs before any request', async () => {
    const f = mockFetch(async () => ok({}));
    await expect(postJson('http://insecure.example/x', {})).rejects.toMatchObject({ code: 'insecure_url' });
    expect(f).not.toHaveBeenCalled();
  });
  it('POSTs JSON and returns the payload', async () => {
    const f = mockFetch(async () => ok({ a: 1 }));
    await expect(postJson('https://x.test/f', { p: 1 }, { headers: { h: 'v' } })).resolves.toEqual({ a: 1 });
    const [, init] = f.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"p":1}');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', h: 'v' });
  });
  it('normalises HTTP errors using the server error envelope', async () => {
    mockFetch(async () => bad(429, { error: { code: 'rate_limited', message: 'slow down' } }));
    await expect(postJson('https://x.test/f', {})).rejects.toMatchObject({ status: 429, code: 'rate_limited', message: 'slow down' });
    mockFetch(async () => ({ ok: false, status: 500, json: async () => { throw new Error('not json'); } }));
    await expect(postJson('https://x.test/f', {})).rejects.toMatchObject({ status: 500, code: 'http_error' });
  });
  it('maps network failures and timeouts', async () => {
    mockFetch(async () => { throw new TypeError('Network request failed'); });
    await expect(postJson('https://x.test/f', {})).rejects.toMatchObject({ status: 0, code: 'network' });
    mockFetch(async () => { throw Object.assign(new Error('aborted'), { name: 'AbortError' }); });
    await expect(postJson('https://x.test/f', {})).rejects.toMatchObject({ status: 0, code: 'timeout' });
  });
});

describe('withRetry', () => {
  const sleep = jest.fn(async () => undefined);
  beforeEach(() => sleep.mockClear());
  it('retries with exponential backoff then succeeds', async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error('a')).mockRejectedValueOnce(new Error('b')).mockResolvedValue('ok');
    await expect(withRetry(fn, { retries: 3, baseDelayMs: 100, sleep })).resolves.toBe('ok');
    expect(sleep.mock.calls.map(c => (c as unknown as number[])[0])).toEqual([100, 200]);
  });
  it('gives up after the retry budget and honours shouldRetry', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('x'));
    await expect(withRetry(fn, { retries: 2, baseDelayMs: 1, sleep })).rejects.toThrow('x');
    expect(fn).toHaveBeenCalledTimes(3);
    const once = jest.fn().mockRejectedValue(new Error('fatal'));
    await expect(withRetry(once, { retries: 5, baseDelayMs: 1, sleep, shouldRetry: () => false })).rejects.toThrow('fatal');
    expect(once).toHaveBeenCalledTimes(1);
  });
});

describe('authApi', () => {
  const noSleep = async () => undefined;
  it('checkOtpAllowance calls otp-guard with the public anon key only', async () => {
    const f = mockFetch(async () => ok({ allowed: true, retryAfterSec: 0 }));
    const api = createAuthApi(noSleep);
    await expect(api.checkOtpAllowance('+919876543210', 'dev-1')).resolves.toEqual({ allowed: true, retryAfterSec: 0 });
    const [url, init] = f.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toBe(`${API_CONFIG.functionsBaseUrl}/otp-guard`);
    expect(init.headers.Authorization).toBe(`Bearer ${API_CONFIG.anonKey}`);
    expect(JSON.parse(init.body)).toEqual({ phone: '+919876543210', deviceId: 'dev-1' });
  });
  it('syncUser sends the Firebase ID token as the bearer and device context as body', async () => {
    const f = mockFetch(async () => ok({ profile: PROFILE, isNewUser: true }));
    const api = createAuthApi(noSleep);
    const r = await api.syncUser('firebase-id-token', { deviceId: 'd', platform: 'android', appVersion: '1.0.0' });
    expect(r.isNewUser).toBe(true);
    const [url, init] = f.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toBe(`${API_CONFIG.functionsBaseUrl}/auth-sync`);
    expect(init.headers.Authorization).toBe('Bearer firebase-id-token');
    expect(JSON.parse(init.body)).toEqual({ deviceId: 'd', platform: 'android', appVersion: '1.0.0' });
  });
  it('retries transient failures (network / 5xx) but not 4xx', async () => {
    const f = mockFetch(jest.fn().mockRejectedValueOnce(new TypeError('x')).mockResolvedValueOnce(bad(503)).mockResolvedValueOnce(ok({ profile: PROFILE, isNewUser: false })));
    const api = createAuthApi(noSleep);
    await expect(api.syncUser('t', { deviceId: 'd', platform: 'ios', appVersion: '1' })).resolves.toMatchObject({ isNewUser: false });
    expect(f).toHaveBeenCalledTimes(3);
    const f2 = mockFetch(async () => bad(401, { error: { code: 'invalid_token', message: 'no' } }));
    await expect(api.syncUser('t', { deviceId: 'd', platform: 'ios', appVersion: '1' })).rejects.toBeInstanceOf(ApiError);
    expect(f2).toHaveBeenCalledTimes(1);
  });
});
