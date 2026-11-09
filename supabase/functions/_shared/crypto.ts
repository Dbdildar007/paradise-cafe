/** HMAC-SHA256 hex digest. Used to store phone numbers / device ids as irreversible keyed hashes. */
export const hmacSha256Hex = async (secret: string, message: string): Promise<string> => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('');
};
