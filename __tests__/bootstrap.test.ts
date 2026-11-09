import { bootstrapApp } from '../src/app/bootstrap';
import * as integrity from '../src/security/deviceIntegrity';
import { secureStorage } from '../src/security/secureStorage';
import * as fb from '../src/services/auth/firebasePhoneAuth';

describe('bootstrapApp', () => {
  afterEach(() => jest.restoreAllMocks());

  it('is ready & signed-out without a token', async () => {
    jest.spyOn(secureStorage, 'getItem').mockResolvedValue(null);
    await expect(bootstrapApp()).resolves.toEqual({ status: 'ready', hasSession: false });
  });
  it('restores a session from secure storage', async () => {
    jest.spyOn(secureStorage, 'getItem').mockResolvedValue('jwt');
    await expect(bootstrapApp()).resolves.toEqual({ status: 'ready', hasSession: true });
  });
  it('restores a session from Firebase Auth', async () => {
    jest.spyOn(secureStorage, 'getItem').mockResolvedValue(null);
    jest.spyOn(fb, 'hasFirebaseSession').mockReturnValue(true);
    await expect(bootstrapApp()).resolves.toEqual({ status: 'ready', hasSession: true });
  });
  it('degrades to signed-out if storage throws (never hangs the splash)', async () => {
    jest.spyOn(secureStorage, 'getItem').mockRejectedValue(new Error('x'));
    await expect(bootstrapApp()).resolves.toEqual({ status: 'ready', hasSession: false });
  });
  it('blocks and wipes tokens on a compromised device in release builds', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    jest.spyOn(integrity, 'checkDeviceIntegrity').mockResolvedValue({ compromised: true, reasons: ['hooked'] });
    const wipe = jest.spyOn(secureStorage, 'clearAll').mockResolvedValue();
    const signOut = jest.spyOn(fb.firebasePhoneAuth, 'signOut').mockResolvedValue();
    await expect(bootstrapApp()).resolves.toEqual({ status: 'blocked', reason: 'compromised_device' });
    expect(wipe).toHaveBeenCalled();
    expect(signOut).toHaveBeenCalled();
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
  });
});
