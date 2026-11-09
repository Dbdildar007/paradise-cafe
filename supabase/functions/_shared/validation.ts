const E164_INDIA = /^\+91[6-9][0-9]{9}$/;
const DEVICE_ID = /^[A-Za-z0-9._-]{8,128}$/;
const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-fA-F:]{2,45}$/;

export const isIndianE164 = (v: unknown): v is string => typeof v === 'string' && E164_INDIA.test(v);
export const isDeviceId = (v: unknown): v is string => typeof v === 'string' && DEVICE_ID.test(v);

export type Platform = 'ios' | 'android' | 'other';
export const parsePlatform = (v: unknown): Platform => (v === 'ios' || v === 'android' ? v : 'other');

export const parseAppVersion = (v: unknown): string | null =>
  typeof v === 'string' && /^[0-9A-Za-z.+-]{1,32}$/.test(v) ? v : null;

/** First hop of x-forwarded-for if it looks like an IP address, else null (never trust arbitrary header text). */
export const clientIp = (req: Request): string | null => {
  const raw = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  return IPV4.test(raw) || (raw.includes(':') && IPV6.test(raw)) ? raw : null;
};

export const bearerToken = (req: Request): string | null => {
  const h = req.headers.get('authorization') ?? '';
  const m = /^Bearer\s+([A-Za-z0-9._~+/=-]{20,4096})$/.exec(h);
  return m ? (m[1] ?? null) : null;
};
