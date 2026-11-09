import assert from 'node:assert/strict';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createFirebaseVerifier } from './firebase.ts';

const PROJECT = 'paradise-test';
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
const verify = createFirebaseVerifier(PROJECT, createLocalJWKSet({ keys: [jwk] }));
const other = await generateKeyPair('RS256');

type Over = Partial<{ iss: string; aud: string; sub: string; exp: string | number; provider: string; phone: string | undefined; authTime: number; key: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'] }>;
const token = (o: Over = {}) =>
  new SignJWT({
    phone_number: 'phone' in o ? o.phone : '+919876543210',
    auth_time: o.authTime ?? Math.floor(Date.now() / 1000) - 5,
    firebase: { sign_in_provider: o.provider ?? 'phone', identities: {} },
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(o.iss ?? `https://securetoken.google.com/${PROJECT}`)
    .setAudience(o.aud ?? PROJECT)
    .setSubject(o.sub ?? 'firebase-uid-1')
    .setIssuedAt()
    .setExpirationTime(o.exp ?? '1h')
    .sign(o.key ?? privateKey);

Deno.test('accepts a valid Firebase phone token', async () => {
  assert.deepEqual(await verify(await token()), { uid: 'firebase-uid-1', phone: '+919876543210' });
});

for (const [name, over] of Object.entries({
  'wrong audience (another Firebase project)': { aud: 'someone-else' },
  'wrong issuer': { iss: 'https://evil.example' },
  'expired': { exp: Math.floor(Date.now() / 1000) - 600 },
  'signed with a different key': { key: other.privateKey },
  'not a phone sign-in (e.g. anonymous / google)': { provider: 'google.com' },
  'missing phone number': { phone: undefined },
  'auth_time in the future': { authTime: Math.floor(Date.now() / 1000) + 3600 },
  'empty subject': { sub: '' },
} as Record<string, Over>)) {
  Deno.test(`rejects: ${name}`, async () => {
    await assert.rejects(async () => verify(await token(over)));
  });
}

Deno.test('rejects garbage and alg=none tokens', async () => {
  await assert.rejects(verify('not-a-jwt'));
  const none = `${btoa('{"alg":"none"}')}.${btoa('{"sub":"x"}')}.`;
  await assert.rejects(verify(none));
});
