import type { TokenVerifier } from '../_shared/firebase.ts';
import { errorJson, json, readJson } from '../_shared/http.ts';
import { bearerToken, clientIp, isDeviceId, isIndianE164, parseAppVersion, parsePlatform } from '../_shared/validation.ts';
import type { Rpc } from '../otp-guard/handler.ts';

export type AuthSyncDeps = { verifyToken: TokenVerifier; rpc: Rpc };

type Row = {
  profile_id: string;
  phone_e164: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  loyalty_tier: string;
  loyalty_points: number;
  referral_code: string | null;
  is_new_user: boolean;
};

/**
 * POST /auth-sync   Authorization: Bearer <Firebase ID token>   { deviceId, platform, appVersion }
 * Runs only AFTER Firebase verified the OTP. Verifies the token, then creates the customer profile (new user) or
 * loads it (returning user) in one atomic database call. The phone number comes from the VERIFIED token, never from the body.
 */
export const createAuthSyncHandler = (deps: AuthSyncDeps) => async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return errorJson(405, 'method_not_allowed', 'Use POST', { Allow: 'POST' });
  }
  const token = bearerToken(req);
  if (!token) {
    return errorJson(401, 'missing_token', 'Authentication required');
  }
  let claims;
  try {
    claims = await deps.verifyToken(token);
  } catch {
    return errorJson(401, 'invalid_token', 'Authentication failed'); // never reveal why
  }
  if (!isIndianE164(claims.phone)) {
    return errorJson(403, 'unsupported_region', 'Only Indian mobile numbers are supported');
  }

  let body: { deviceId?: unknown; platform?: unknown; appVersion?: unknown };
  try {
    body = (await readJson(req)) as typeof body;
  } catch {
    return errorJson(400, 'invalid_body', 'Invalid request body');
  }
  if (!isDeviceId(body.deviceId)) {
    return errorJson(400, 'invalid_input', 'Invalid device');
  }

  const { data, error } = await deps.rpc('upsert_profile_on_login', {
    p_firebase_uid: claims.uid,
    p_phone_e164: claims.phone,
    p_device_id: body.deviceId,
    p_platform: parsePlatform(body.platform),
    p_app_version: parseAppVersion(body.appVersion),
    p_ip: clientIp(req),
  });

  if (error) {
    if (error.message.includes('account_suspended')) {
      return errorJson(403, 'account_suspended', 'This account has been suspended');
    }
    if (error.message.includes('phone_conflict')) {
      return errorJson(409, 'phone_conflict', 'This number is linked to another account');
    }
    return errorJson(500, 'server_error', 'Something went wrong');
  }
  const row = Array.isArray(data) ? (data[0] as Row | undefined) : undefined;
  if (!row) {
    return errorJson(500, 'server_error', 'Something went wrong');
  }
  return json(200, {
    profile: {
      id: row.profile_id,
      phone: row.phone_e164,
      fullName: row.full_name,
      email: row.email,
      avatarUrl: row.avatar_url,
      loyaltyTier: row.loyalty_tier,
      loyaltyPoints: row.loyalty_points,
      referralCode: row.referral_code,
    },
    isNewUser: row.is_new_user,
  });
};
