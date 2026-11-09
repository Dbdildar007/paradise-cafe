import { API_CONFIG } from '../../config/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Options = { headers?: Record<string, string>; timeoutMs?: number };

/**
 * The only HTTP entry point of the app: timeout, JSON, normalised errors.
 * Request/response bodies are NEVER logged (they contain phone numbers and tokens).
 */
export const postJson = async <T>(url: string, body: unknown, options: Options = {}): Promise<T> => {
  if (!url.startsWith('https://')) {
    throw new ApiError(0, 'insecure_url', 'Only HTTPS endpoints are allowed');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? API_CONFIG.timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options.headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    if (!res.ok) {
      const err = (payload as { error?: { code?: string; message?: string } } | null)?.error;
      throw new ApiError(res.status, err?.code ?? 'http_error', err?.message ?? `Request failed (${res.status})`);
    }
    return payload as T;
  } catch (e) {
    if (e instanceof ApiError) {
      throw e;
    }
    const aborted = (e as { name?: string })?.name === 'AbortError';
    throw new ApiError(0, aborted ? 'timeout' : 'network', aborted ? 'Request timed out' : 'Network error');
  } finally {
    clearTimeout(timer);
  }
};
