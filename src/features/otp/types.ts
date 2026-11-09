import type { LimiterStatus } from './resendLimiter';

export type AuthFailureKind =
  | 'invalid_code'
  | 'expired'
  | 'too_many_requests'
  | 'network'
  | 'invalid_phone'
  | 'app_not_verified'
  | 'user_disabled'
  | 'sync_failed'
  | 'unknown';

export type AuthFailure = { kind: AuthFailureKind; message: string };

export type PhoneAuthEvents = {
  onCodeSent: (verificationId: string) => void;
  /** Android only: the SMS was read automatically (Firebase auto-retrieval). */
  onAutoVerified: (p: { code: string; verificationId: string }) => void;
  /** Android only: Firebase verified the number instantly without an SMS. */
  onInstantSignIn: () => void;
  onError: (failure: AuthFailure) => void;
};

export type PhoneAuthService = {
  start: (phoneE164: string, forceResend: boolean, events: PhoneAuthEvents) => { cancel: () => void };
  confirm: (verificationId: string, code: string) => Promise<{ idToken: string; isNewUser: boolean }>;
  /** Used after instant verification (no code to confirm). */
  currentIdToken: () => Promise<{ idToken: string; isNewUser: boolean } | null>;
  signOut: () => Promise<void>;
};

export type UserProfile = {
  id: string;
  phone: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  loyaltyTier: string;
  loyaltyPoints: number;
  referralCode: string | null;
};

export type SyncResult = { profile: UserProfile; isNewUser: boolean };
export type OtpAllowance = { allowed: boolean; retryAfterSec: number };

export type SyncContext = { deviceId: string; platform: 'ios' | 'android' | 'other'; appVersion: string };

export type OtpApi = {
  checkOtpAllowance: (phoneE164: string, deviceId: string) => Promise<OtpAllowance>;
  syncUser: (idToken: string, ctx: SyncContext) => Promise<SyncResult>;
};

export type OtpLimiter = {
  status: (phoneE164: string) => Promise<LimiterStatus>;
  recordSend: (phoneE164: string) => Promise<LimiterStatus>;
  clearCooldown: (phoneE164: string) => Promise<void>;
};

/** Everything the OTP flow touches, injectable for tests. */
export type OtpDeps = {
  phoneAuth: PhoneAuthService;
  api: OtpApi;
  limiter: OtpLimiter;
  getDeviceId: () => Promise<string>;
  getSyncContext: (deviceId: string) => SyncContext;
  now: () => number;
};
