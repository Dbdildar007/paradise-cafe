import * as Keychain from 'react-native-keychain';

/**
 * ONLY place where sensitive data is persisted. Backed by iOS Keychain and Android Keystore
 * (hardware-backed / StrongBox where available). Plain AsyncStorage is banned by ESLint + postinstall check.
 *
 * Rules:
 *  - an allow-list of keys (no arbitrary writes)
 *  - one Keychain "service" per key, namespaced to the app
 *  - items are available only when the device is unlocked and NEVER migrate to another device / backups
 */
export type SecureKey = 'access_token' | 'refresh_token' | 'device_id' | 'otp_limiter';
const ALLOWED: readonly SecureKey[] = ['access_token', 'refresh_token', 'device_id', 'otp_limiter'];
const NAMESPACE = 'in.paradisecafe.secure';

const assertKey: (key: string) => asserts key is SecureKey = key => {
  if (!(ALLOWED as readonly string[]).includes(key)) {
    throw new Error('secureStorage: key is not allow-listed');
  }
};
const service = (key: SecureKey) => `${NAMESPACE}.${key}`;

export const secureStorage = {
  async setItem(key: SecureKey, value: string): Promise<boolean> {
    assertKey(key);
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error('secureStorage: empty value');
    }
    const res = await Keychain.setGenericPassword(key, value, {
      service: service(key),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      storage: Keychain.STORAGE_TYPE.AES_GCM,
    });
    return !!res;
  },

  async getItem(key: SecureKey): Promise<string | null> {
    assertKey(key);
    try {
      const creds = await Keychain.getGenericPassword({ service: service(key) });
      return creds ? creds.password : null;
    } catch {
      return null; // treat keystore errors as "no value" - never surface internals
    }
  },

  async removeItem(key: SecureKey): Promise<void> {
    assertKey(key);
    await Keychain.resetGenericPassword({ service: service(key) });
  },

  /** Logout / "wipe on compromise". */
  async clearAll(): Promise<void> {
    await Promise.all(ALLOWED.map(k => Keychain.resetGenericPassword({ service: service(k) })));
  },
};
