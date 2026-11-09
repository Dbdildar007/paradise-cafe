/**
 * Backend endpoints (Supabase Edge Functions). The anon key is PUBLIC by design (it only grants what RLS allows);
 * the service-role key must NEVER be placed in the app. `npm run verify:pins` blocks releases while REPLACE_ME remains.
 */
export const API_CONFIG = {
  functionsBaseUrl: 'https://REPLACE_ME_PROJECT_REF.supabase.co/functions/v1',
  anonKey: 'REPLACE_ME_SUPABASE_ANON_KEY',
  timeoutMs: 15_000,
} as const;

export const LEGAL_URLS = {
  terms: 'https://paradisecafe.in/terms',
  privacy: 'https://paradisecafe.in/privacy',
} as const;

export const APP_VERSION = '1.0.0';
