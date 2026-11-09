import { Platform } from 'react-native';
import { APP_VERSION } from '../../config/api';
import type { SyncContext } from '../../features/otp/types';
import { secureStorage } from '../../security/secureStorage';

const uuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r % 4) + 8).toString(16);
  });

/** Stable per-install identifier (used for server-side abuse limits). Not a secret; stored in Keychain/Keystore anyway. */
export const getOrCreateDeviceId = async (): Promise<string> => {
  const existing = await secureStorage.getItem('device_id');
  if (existing) {
    return existing;
  }
  const id = uuid();
  await secureStorage.setItem('device_id', id).catch(() => undefined);
  return id;
};

export const buildSyncContext = (deviceId: string): SyncContext => ({
  deviceId,
  platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'other',
  appVersion: APP_VERSION,
});
