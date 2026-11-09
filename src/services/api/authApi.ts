import { API_CONFIG } from '../../config/api';
import type { OtpAllowance, OtpApi, SyncContext, SyncResult } from '../../features/otp/types';
import { ApiError, postJson } from './httpClient';
import { withRetry } from './retry';

const url = (fn: string) => `${API_CONFIG.functionsBaseUrl}/${fn}`;

/** Retry only transient failures (network / timeout / 5xx), never 4xx. */
const isTransient = (e: unknown) => e instanceof ApiError && (e.status === 0 || e.status >= 500);

export const createAuthApi = (sleep?: (ms: number) => Promise<void>): OtpApi => ({
  /** Server-side abuse guard, called BEFORE Firebase sends an SMS (SMS-pumping / toll-fraud protection). */
  async checkOtpAllowance(phoneE164, deviceId): Promise<OtpAllowance> {
    return withRetry(
      () =>
        postJson<OtpAllowance>(
          url('otp-guard'),
          { phone: phoneE164, deviceId },
          { headers: { apikey: API_CONFIG.anonKey, Authorization: `Bearer ${API_CONFIG.anonKey}` } },
        ),
      { retries: 1, baseDelayMs: 400, shouldRetry: isTransient, sleep },
    );
  },

  /**
   * After Firebase verified the OTP: the Edge Function verifies the Firebase ID token and creates the profile
   * (new user) or loads it (returning user). Idempotent, so it is safe to retry.
   */
  async syncUser(idToken: string, ctx: SyncContext): Promise<SyncResult> {
    return withRetry(
      () =>
        postJson<SyncResult>(url('auth-sync'), ctx, {
          headers: { apikey: API_CONFIG.anonKey, Authorization: `Bearer ${idToken}` },
        }),
      { retries: 2, baseDelayMs: 500, shouldRetry: isTransient, sleep },
    );
  },
});

export const authApi = createAuthApi();
