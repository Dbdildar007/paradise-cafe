import { ResendLimiter, LimiterStore } from '../src/features/otp/resendLimiter';
import type { OtpDeps, PhoneAuthEvents, SyncResult } from '../src/features/otp/types';

export const PROFILE: SyncResult['profile'] = {
  id: 'p-1',
  phone: '+919876543210',
  fullName: null,
  email: null,
  avatarUrl: null,
  loyaltyTier: 'bronze',
  loyaltyPoints: 0,
  referralCode: 'PARA1234',
};

export const memoryStore = (): LimiterStore & { raw: () => string | null } => {
  let value: string | null = null;
  return {
    read: async () => value,
    write: async v => {
      value = v;
      return true;
    },
    raw: () => value,
  };
};

/** Fully faked OtpDeps. `events()` returns the callbacks the hook registered with phoneAuth.start. */
export const makeDeps = () => {
  const clock = { now: 1_700_000_000_000 };
  let registered: PhoneAuthEvents | null = null;
  const cancel = jest.fn();
  const phoneAuth = {
    start: jest.fn((_phone: string, _force: boolean, ev: PhoneAuthEvents) => {
      registered = ev;
      return { cancel };
    }),
    confirm: jest.fn().mockResolvedValue({ idToken: 'id-token', isNewUser: true }),
    currentIdToken: jest.fn().mockResolvedValue({ idToken: 'id-token', isNewUser: false }),
    signOut: jest.fn().mockResolvedValue(undefined),
  };
  const api = {
    checkOtpAllowance: jest.fn().mockResolvedValue({ allowed: true, retryAfterSec: 0 }),
    syncUser: jest.fn().mockResolvedValue({ profile: PROFILE, isNewUser: true } as SyncResult),
  };
  const store = memoryStore();
  const limiter = new ResendLimiter(store, () => clock.now);
  const deps: OtpDeps = {
    phoneAuth,
    api,
    limiter,
    getDeviceId: async () => 'device-1',
    getSyncContext: id => ({ deviceId: id, platform: 'android', appVersion: '1.0.0' }),
    now: () => clock.now,
  };
  return {
    deps,
    phoneAuth,
    api,
    limiter,
    clock,
    cancel,
    store,
    events: () => {
      if (!registered) {
        throw new Error('phoneAuth.start was not called');
      }
      return registered;
    },
  };
};

/** Lets pending promise chains run so `phoneAuth.start` gets called. */
export const waitFor = async (cond: () => boolean, tries = 50) => {
  for (let i = 0; i < tries && !cond(); i += 1) {
    await Promise.resolve();
    await new Promise<void>(r => setImmediate(r));
  }
  if (!cond()) {
    throw new Error('condition not met');
  }
};
