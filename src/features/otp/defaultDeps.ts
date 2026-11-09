import { authApi } from '../../services/api/authApi';
import { firebasePhoneAuth } from '../../services/auth/firebasePhoneAuth';
import { buildSyncContext, getOrCreateDeviceId } from '../../services/auth/deviceId';
import { ResendLimiter } from './resendLimiter';
import type { OtpDeps } from './types';

export const defaultOtpDeps: OtpDeps = {
  phoneAuth: firebasePhoneAuth,
  api: authApi,
  limiter: new ResendLimiter(),
  getDeviceId: getOrCreateDeviceId,
  getSyncContext: buildSyncContext,
  now: Date.now,
};
