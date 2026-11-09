/** Single source of truth for OTP rules (mirrored server-side in supabase/migrations/..._otp_guard.sql). */
export const OTP_POLICY = {
  length: 6,
  cooldownSeconds: 60,
  /** Resends allowed per phone inside the window (the first send is not a resend). */
  maxResends: 3,
  windowMs: 5 * 60 * 60 * 1000, // 5 hours
  maxVerifyAttempts: 5,
  autoVerifyTimeoutSec: 60,
} as const;

export const MAX_SENDS_PER_WINDOW = 1 + OTP_POLICY.maxResends;
