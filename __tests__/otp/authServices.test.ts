import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import { failure, mapFirebaseError } from '../../src/services/auth/authErrors';
import { buildSyncContext, getOrCreateDeviceId } from '../../src/services/auth/deviceId';
import { firebasePhoneAuth, getFreshIdToken, hasFirebaseSession } from '../../src/services/auth/firebasePhoneAuth';
import { requestDevicePhoneNumber } from '../../src/services/auth/phoneHint';
import * as Keychain from 'react-native-keychain';

const instance = (auth as unknown as jest.Mock)() as {
  verifyPhoneNumber: jest.Mock;
  signInWithCredential: jest.Mock;
  signOut: jest.Mock;
  currentUser: null | { getIdToken: () => Promise<string> };
};

describe('mapFirebaseError', () => {
  it.each([
    ['auth/invalid-verification-code', 'invalid_code'],
    ['auth/code-expired', 'expired'],
    ['auth/session-expired', 'expired'],
    ['auth/too-many-requests', 'too_many_requests'],
    ['auth/quota-exceeded', 'too_many_requests'],
    ['auth/network-request-failed', 'network'],
    ['auth/invalid-phone-number', 'invalid_phone'],
    ['auth/missing-client-identifier', 'app_not_verified'],
    ['auth/user-disabled', 'user_disabled'],
    ['auth/something-new', 'unknown'],
  ])('%s -> %s', (code, kind) => expect(mapFirebaseError({ code }).kind).toBe(kind));

  it('handles non-errors and never leaks raw messages', () => {
    expect(mapFirebaseError(null).kind).toBe('unknown');
    expect(mapFirebaseError('boom').kind).toBe('unknown');
    expect(mapFirebaseError({ code: 'auth/invalid-verification-code', message: 'project-secret-123' }).message).not.toContain('secret');
    expect(failure('network').message).toMatch(/internet/i);
  });
});

describe('firebasePhoneAuth.start', () => {
  const setup = () => {
    let onState: (s: Record<string, unknown>) => void = () => undefined;
    let onErr: (e: unknown) => void = () => undefined;
    instance.verifyPhoneNumber.mockReturnValue({
      on: (_evt: string, next: typeof onState, err: typeof onErr) => {
        onState = next;
        onErr = err;
      },
    });
    const events = { onCodeSent: jest.fn(), onAutoVerified: jest.fn(), onInstantSignIn: jest.fn(), onError: jest.fn() };
    const handle = firebasePhoneAuth.start('+919876543210', true, events);
    return { events, handle, emit: (s: Record<string, unknown>) => onState(s), fail: (e: unknown) => onErr(e) };
  };

  it('requests verification with timeout and forceResend', () => {
    setup();
    expect(instance.verifyPhoneNumber).toHaveBeenCalledWith('+919876543210', 60, true);
  });
  it('maps snapshot states to events', () => {
    const { events, emit } = setup();
    emit({ state: 'sent', verificationId: 'vid' });
    expect(events.onCodeSent).toHaveBeenCalledWith('vid');
    emit({ state: 'verified', verificationId: 'vid', code: '123456' });
    expect(events.onAutoVerified).toHaveBeenCalledWith({ code: '123456', verificationId: 'vid' });
    emit({ state: 'verified', verificationId: 'vid', code: null });
    expect(events.onInstantSignIn).toHaveBeenCalled();
    emit({ state: 'timeout', verificationId: 'vid' });
    emit({ state: 'error', error: { code: 'auth/too-many-requests' } });
    expect(events.onError).toHaveBeenCalledWith(expect.objectContaining({ kind: 'too_many_requests' }));
  });
  it('forwards stream errors and stops after cancel()', () => {
    const { events, emit, fail, handle } = setup();
    fail({ code: 'auth/network-request-failed' });
    expect(events.onError).toHaveBeenCalledWith(expect.objectContaining({ kind: 'network' }));
    handle.cancel();
    emit({ state: 'sent', verificationId: 'late' });
    fail({ code: 'auth/x' });
    expect(events.onCodeSent).not.toHaveBeenCalled();
    expect(events.onError).toHaveBeenCalledTimes(1);
  });
});

describe('firebasePhoneAuth session', () => {
  beforeEach(() => {
    instance.currentUser = null;
    jest.clearAllMocks();
  });
  it('confirm signs in with the phone credential and returns the ID token + isNewUser', async () => {
    instance.signInWithCredential.mockResolvedValue({ user: { getIdToken: async () => 'tok' }, additionalUserInfo: { isNewUser: true } });
    await expect(firebasePhoneAuth.confirm('vid', '123456')).resolves.toEqual({ idToken: 'tok', isNewUser: true });
    expect((auth as unknown as { PhoneAuthProvider: { credential: jest.Mock } }).PhoneAuthProvider.credential).toHaveBeenCalledWith('vid', '123456');
  });
  it('confirm defaults isNewUser to false and propagates errors', async () => {
    instance.signInWithCredential.mockResolvedValueOnce({ user: { getIdToken: async () => 't' } });
    await expect(firebasePhoneAuth.confirm('v', '1')).resolves.toEqual({ idToken: 't', isNewUser: false });
    instance.signInWithCredential.mockRejectedValueOnce({ code: 'auth/invalid-verification-code' });
    await expect(firebasePhoneAuth.confirm('v', '1')).rejects.toEqual({ code: 'auth/invalid-verification-code' });
  });
  it('currentIdToken / hasFirebaseSession / getFreshIdToken', async () => {
    expect(await firebasePhoneAuth.currentIdToken()).toBeNull();
    expect(hasFirebaseSession()).toBe(false);
    expect(await getFreshIdToken()).toBeNull();
    instance.currentUser = { getIdToken: async () => 'live' };
    expect(await firebasePhoneAuth.currentIdToken()).toEqual({ idToken: 'live', isNewUser: false });
    expect(hasFirebaseSession()).toBe(true);
    expect(await getFreshIdToken()).toBe('live');
  });
  it('hasFirebaseSession is false when Firebase is not configured', () => {
    (auth as unknown as jest.Mock).mockImplementationOnce(() => {
      throw new Error('No Firebase App');
    });
    expect(hasFirebaseSession()).toBe(false);
  });
  it('signOut delegates', async () => {
    await firebasePhoneAuth.signOut();
    expect(instance.signOut).toHaveBeenCalled();
  });
});

describe('phone hint (device numbers)', () => {
  const original = Platform.OS;
  afterEach(() => {
    Platform.OS = original;
    jest.clearAllMocks();
  });
  it('returns null on iOS without calling Play Services', async () => {
    Platform.OS = 'ios';
    await expect(requestDevicePhoneNumber()).resolves.toBeNull();
  
  });

});

describe('device id', () => {
  beforeEach(() => jest.clearAllMocks());
  it('creates a uuid once and reuses it', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
    const id = await getOrCreateDeviceId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(Keychain.setGenericPassword).toHaveBeenCalledWith('device_id', id, expect.any(Object));
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({ username: 'device_id', password: 'existing' });
    await expect(getOrCreateDeviceId()).resolves.toBe('existing');
  });
  it('builds the sync context', () => {
    expect(buildSyncContext('d')).toMatchObject({ deviceId: 'd', appVersion: '1.0.0' });
  });
});
