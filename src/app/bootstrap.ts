import { SECURITY_POLICY } from '../config/security';
import { checkDeviceIntegrity } from '../security/deviceIntegrity';
import { firebasePhoneAuth, hasFirebaseSession } from '../services/auth/firebasePhoneAuth';
import { secureStorage } from '../security/secureStorage';
import { setupSslPinning } from '../security/sslPinning';
import { logger } from '../utils/logger';
import { withTimeout } from '../utils/delay';

export type BootstrapResult =
  | { status: 'ready'; hasSession: boolean }
  | { status: 'blocked'; reason: 'compromised_device' };

const run = async (): Promise<BootstrapResult> => {
  // 1. Device integrity (release only - emulators/debuggers are expected in dev)
  if (!__DEV__ && SECURITY_POLICY.blockCompromisedDevices) {
    const report = await checkDeviceIntegrity();
    if (report.compromised) {
      await secureStorage.clearAll().catch(() => undefined); // wipe tokens on a hostile device
      await firebasePhoneAuth.signOut().catch(() => undefined);
      return { status: 'blocked', reason: 'compromised_device' };
    }
  }
  // 2. Certificate pinning must be active before any network call is made
  await setupSslPinning(host => logger.warn('SSL pin violation', host));
  // 3. Restore session from hardware-backed storage
  const token = await secureStorage.getItem('access_token');
  return { status: 'ready', hasSession: hasFirebaseSession() || !!token };
};

/** Never throws: a failure degrades to a signed-out, ready state rather than a stuck splash. */
export const bootstrapApp = async (): Promise<BootstrapResult> => {
  const safe = run().catch((e): BootstrapResult => {
    logger.error('bootstrap failed', e);
    return { status: 'ready', hasSession: false };
  });
  return withTimeout<BootstrapResult>(safe, SECURITY_POLICY.bootstrapTimeoutMs, { status: 'ready', hasSession: false });
};
