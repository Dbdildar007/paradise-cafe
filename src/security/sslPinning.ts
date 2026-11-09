import {
  addSslPinningErrorListener,
  initializeSslPinning,
} from 'react-native-ssl-public-key-pinning';
import { SSL_PINS } from '../config/security';
import { logger } from '../utils/logger';

/**
 * Enables native (OkHttp / TrustKit) public-key pinning for every fetch/XHR to the pinned hosts.
 * A proxy such as Charles / Burp / mitmproxy presents a different key => handshake fails => request blocked.
 */
export const isPlaceholderPin = (pins = SSL_PINS): boolean =>
  Object.values(pins).some(p => p.publicKeyHashes.some(h => h.startsWith('REPLACE_ME')));

export const setupSslPinning = async (onViolation?: (message: string) => void): Promise<void> => {
  if (__DEV__ || isPlaceholderPin()) {
    // Dev (Metro / local proxies) and un-provisioned builds run unpinned. CI blocks releases in this state.
    logger.warn('SSL pinning disabled for this build');
    return;
  }
  addSslPinningErrorListener(error => {
    onViolation?.(error.serverHostname);
  });
  await initializeSslPinning(SSL_PINS);
};
