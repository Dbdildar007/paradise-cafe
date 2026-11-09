import { hmacSha256Hex } from '../_shared/crypto.ts';
import { errorJson, json, readJson } from '../_shared/http.ts';
import { clientIp, isDeviceId, isIndianE164 } from '../_shared/validation.ts';

export type Rpc = (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
export type OtpGuardDeps = { rpc: Rpc; pepper: string };

/**
 * POST /otp-guard  { phone: "+91XXXXXXXXXX", deviceId }  ->  { allowed, retryAfterSec }
 * Called by the app BEFORE Firebase sends an SMS. Enforces (in Postgres, race-free):
 * 1 send + 3 resends per phone / 5 h, 55 s cooldown, 12 sends per device / 5 h. Fails CLOSED on any error.
 */
export const createOtpGuardHandler = (deps: OtpGuardDeps) => async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return errorJson(405, 'method_not_allowed', 'Use POST', { Allow: 'POST' });
  }
  let body: { phone?: unknown; deviceId?: unknown };
  try {
    body = (await readJson(req)) as typeof body;
  } catch {
    return errorJson(400, 'invalid_body', 'Invalid request body');
  }
  if (!isIndianE164(body.phone) || !isDeviceId(body.deviceId)) {
    return errorJson(400, 'invalid_input', 'Invalid phone or device');
  }

  const [phoneHash, deviceHash] = await Promise.all([
    hmacSha256Hex(deps.pepper, `phone:${body.phone}`),
    hmacSha256Hex(deps.pepper, `device:${body.deviceId}`),
  ]);
  const { data, error } = await deps.rpc('check_and_log_otp_request', {
    p_phone_hash: phoneHash,
    p_device_hash: deviceHash,
    p_ip: clientIp(req),
  });
  const row = Array.isArray(data) ? (data[0] as { allowed?: boolean; retry_after_sec?: number } | undefined) : undefined;
  if (error || !row || typeof row.allowed !== 'boolean') {
    return errorJson(503, 'unavailable', 'Please try again shortly'); // fail closed
  }
  return json(200, { allowed: row.allowed, retryAfterSec: row.retry_after_sec ?? 0 });
};
