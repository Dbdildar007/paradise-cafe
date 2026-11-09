import type { AuthFailure, AuthFailureKind } from '../../features/otp/types';

const MESSAGES: Record<AuthFailureKind, string> = {
  invalid_code: 'Incorrect OTP. Please check the code and try again.',
  expired: 'This OTP has expired. Please tap Resend OTP.',
  too_many_requests: 'Too many attempts. Please wait a while before trying again.',
  network: 'No connection. Please check your internet and try again.',
  invalid_phone: 'Please enter a valid 10-digit mobile number.',
  app_not_verified: 'We could not verify this app. Please update Paradise Cafe and try again.',
  user_disabled: 'This account has been disabled. Please contact support.',
  sync_failed: 'We could not finish signing you in. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

export const failure = (kind: AuthFailureKind): AuthFailure => ({ kind, message: MESSAGES[kind] });

const CODE_TO_KIND: Record<string, AuthFailureKind> = {
  'auth/invalid-verification-code': 'invalid_code',
  'auth/missing-verification-code': 'invalid_code',
  'auth/code-expired': 'expired',
  'auth/session-expired': 'expired',
  'auth/invalid-verification-id': 'expired',
  'auth/too-many-requests': 'too_many_requests',
  'auth/quota-exceeded': 'too_many_requests',
  'auth/network-request-failed': 'network',
  'auth/invalid-phone-number': 'invalid_phone',
  'auth/missing-phone-number': 'invalid_phone',
  'auth/app-not-authorized': 'app_not_verified',
  'auth/missing-client-identifier': 'app_not_verified',
  'auth/captcha-check-failed': 'app_not_verified',
  'auth/invalid-app-credential': 'app_not_verified',
  'auth/user-disabled': 'user_disabled',
};

/** Never leaks raw Firebase messages (they can contain project identifiers). */
export const mapFirebaseError = (err: unknown): AuthFailure => {
  const code = typeof err === 'object' && err !== null ? (err as { code?: unknown }).code : undefined;
  return failure(typeof code === 'string' ? CODE_TO_KIND[code] ?? 'unknown' : 'unknown');
};
