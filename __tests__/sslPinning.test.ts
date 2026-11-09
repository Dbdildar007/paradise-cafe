import { initializeSslPinning } from 'react-native-ssl-public-key-pinning';
import { isPlaceholderPin, setupSslPinning } from '../src/security/sslPinning';

describe('sslPinning', () => {
  it('detects placeholder pins', () => {
    expect(isPlaceholderPin()).toBe(true);
    expect(isPlaceholderPin({ h: { includeSubdomains: true, publicKeyHashes: ['abc=', 'def='] } })).toBe(false);
  });
  it('is skipped in dev / un-provisioned builds', async () => {
    await setupSslPinning();
    expect(initializeSslPinning).not.toHaveBeenCalled();
  });
});
