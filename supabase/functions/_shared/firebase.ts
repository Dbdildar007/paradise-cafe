import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export type FirebaseClaims = { uid: string; phone: string };
export type TokenVerifier = (token: string) => Promise<FirebaseClaims>;

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

/**
 * Verifies a Firebase ID token WITHOUT calling Firebase: RS256 signature against Google's published keys,
 * issuer + audience bound to OUR project, expiry, and that the user signed in with a verified phone number.
 */
export const createFirebaseVerifier =
  (projectId: string, jwks: JWTVerifyGetKey = GOOGLE_JWKS): TokenVerifier =>
  async token => {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
      clockTolerance: 5,
    });
    const uid = payload.sub;
    const authTime = typeof payload.auth_time === 'number' ? payload.auth_time : Number.NaN;
    const firebase = payload.firebase as { sign_in_provider?: string } | undefined;
    const phone = payload.phone_number;
    if (typeof uid !== 'string' || uid.length === 0 || uid.length > 128) {
      throw new Error('invalid_sub');
    }
    if (!(authTime <= Math.floor(Date.now() / 1000) + 5)) {
      throw new Error('invalid_auth_time');
    }
    if (firebase?.sign_in_provider !== 'phone' || typeof phone !== 'string') {
      throw new Error('not_phone_sign_in');
    }
    return { uid, phone };
  };
