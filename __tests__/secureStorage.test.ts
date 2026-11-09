import * as Keychain from 'react-native-keychain';
import { secureStorage, SecureKey } from '../src/security/secureStorage';

describe('secureStorage (token handling boundaries)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stores in hardware-backed, device-only, when-unlocked Keychain/Keystore', async () => {
    await secureStorage.setItem('access_token', 'jwt');
    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'access_token',
      'jwt',
      expect.objectContaining({
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
        service: 'in.paradisecafe.secure.access_token',
      }),
    );
  });

  it('rejects non-allow-listed keys on every operation', async () => {
    const bad = 'credit_card' as unknown as SecureKey;
    await expect(secureStorage.setItem(bad, 'x')).rejects.toThrow('allow-listed');
    await expect(secureStorage.getItem(bad)).rejects.toThrow('allow-listed');
    await expect(secureStorage.removeItem(bad)).rejects.toThrow('allow-listed');
    expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
  });

  it('rejects empty values', async () => {
    await expect(secureStorage.setItem('access_token', '')).rejects.toThrow('empty');
  });

  it('returns null (never throws internals) when the keystore fails', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('keystore boom'));
    await expect(secureStorage.getItem('access_token')).resolves.toBeNull();
  });

  it('returns the stored secret', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({ username: 'access_token', password: 'jwt' });
    await expect(secureStorage.getItem('access_token')).resolves.toBe('jwt');
  });

  it('clearAll wipes every allow-listed key', async () => {
    await secureStorage.clearAll();
    expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(4);
  });
});
