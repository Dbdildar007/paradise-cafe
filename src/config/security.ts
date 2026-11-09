/**
 * Pinning & integrity policy. Pins are SPKI SHA-256 hashes (base64) of your API certificates' public keys.
 * Always ship >= 2 pins (current + backup key) so a certificate rotation cannot brick the app.
 * `npm run verify:pins` fails the release pipeline while any REPLACE_ME placeholder remains.
 *
 * Generate a pin:
 *   openssl s_client -servername api.paradisecafe.in -connect api.paradisecafe.in:443 </dev/null 2>/dev/null \
 *     | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der \
 *     | openssl dgst -sha256 -binary | openssl enc -base64
 */
export const API_HOST = 'api.paradisecafe.in';

export const SSL_PINS: Record<string, { includeSubdomains: boolean; publicKeyHashes: string[] }> = {
  [API_HOST]: {
    includeSubdomains: true,
    publicKeyHashes: [
      'REPLACE_ME_PRIMARY_SPKI_SHA256_BASE64=',
      'REPLACE_ME_BACKUP_SPKI_SHA256_BASE64=',
    ],
  },
};

export const SECURITY_POLICY = {
  /** Block the app on rooted / jailbroken / hooked / debugged devices in release builds. */
  blockCompromisedDevices: true,
  /** Minimum splash time (ms) so the brand moment is seen, but never longer than needed. */
  minSplashMs: 2200,
  /** Hard ceiling for bootstrap work; after this we continue with a safe default. */
  bootstrapTimeoutMs: 8000,
} as const;

export const ALLOWED_DEEP_LINK_SCHEMES = ['paradisecafe://'] as const;
