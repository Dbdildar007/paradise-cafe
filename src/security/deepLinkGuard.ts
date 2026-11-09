import { ALLOWED_DEEP_LINK_SCHEMES } from '../config/security';

const ALLOWED_PATHS = new Set(['welcome', 'login', 'home']);

/** Only app-scheme links to allow-listed paths are accepted; everything else is dropped. */
export const isSafeDeepLink = (url: string | null | undefined): boolean => {
  if (!url || url.length > 2048) {
    return false;
  }
  const scheme = ALLOWED_DEEP_LINK_SCHEMES.find(s => url.startsWith(s));
  if (!scheme) {
    return false;
  }
  const path = url.slice(scheme.length).split(/[?#]/)[0] ?? '';
  return ALLOWED_PATHS.has(path.replace(/\/+$/, ''));
};
