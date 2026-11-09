import assert from 'node:assert/strict';
import type { TokenVerifier } from '../_shared/firebase.ts';
import type { Rpc } from '../otp-guard/handler.ts';
import { createAuthSyncHandler } from './handler.ts';

const TOKEN = 'a'.repeat(40);
const ROW = {
  profile_id: 'p-1', phone_e164: '+919876543210', full_name: null, email: null, avatar_url: null,
  loyalty_tier: 'bronze', loyalty_points: 100, referral_code: 'ABCD1234', is_new_user: true,
};
const okVerifier: TokenVerifier = async () => ({ uid: 'fb-1', phone: '+919876543210' });
const okRpc: Rpc = async () => ({ data: [ROW], error: null });

const call = (h: (r: Request) => Promise<Response>, body: unknown = { deviceId: 'device-1234abcd', platform: 'android', appVersion: '1.0.0' }, headers: Record<string, string> = { authorization: `Bearer ${TOKEN}` }) =>
  h(new Request('https://f.test/auth-sync', { method: 'POST', headers, body: JSON.stringify(body) }));

Deno.test('new user: profile created, phone taken from the VERIFIED token (not the body)', async () => {
  let args: Record<string, unknown> = {};
  const rpc: Rpc = async (name, a) => ((args = { name, ...a }), { data: [ROW], error: null });
  const res = await call(createAuthSyncHandler({ verifyToken: okVerifier, rpc }), { deviceId: 'device-1234abcd', platform: 'ios', appVersion: '2.0.0', phone: '+916000000000', uid: 'attacker' });
  assert.equal(res.status, 200);
  const out = await res.json();
  assert.equal(out.isNewUser, true);
  assert.equal(out.profile.id, 'p-1');
  assert.equal(out.profile.loyaltyPoints, 100);
  assert.equal(args.name, 'upsert_profile_on_login');
  assert.equal(args.p_firebase_uid, 'fb-1');
  assert.equal(args.p_phone_e164, '+919876543210');
  assert.equal(args.p_platform, 'ios');
  assert.equal(args.p_app_version, '2.0.0');
});

Deno.test('returning user: isNewUser=false is passed through', async () => {
  const rpc: Rpc = async () => ({ data: [{ ...ROW, is_new_user: false, full_name: 'Asha' }], error: null });
  const out = await (await call(createAuthSyncHandler({ verifyToken: okVerifier, rpc }))).json();
  assert.equal(out.isNewUser, false);
  assert.equal(out.profile.fullName, 'Asha');
});

Deno.test('401 for a missing, malformed or invalid token - without calling the database', async () => {
  let touched = false;
  const rpc: Rpc = async () => ((touched = true), { data: [ROW], error: null });
  const bad: TokenVerifier = async () => { throw new Error('signature mismatch details'); };
  assert.equal((await call(createAuthSyncHandler({ verifyToken: okVerifier, rpc }), undefined, {})).status, 401);
  assert.equal((await call(createAuthSyncHandler({ verifyToken: okVerifier, rpc }), undefined, { authorization: 'Bearer x' })).status, 401);
  const res = await call(createAuthSyncHandler({ verifyToken: bad, rpc }));
  assert.equal(res.status, 401);
  assert.ok(!JSON.stringify(await res.json()).includes('signature'));
  assert.equal(touched, false);
});

Deno.test('403 for non-Indian numbers in the token', async () => {
  const v: TokenVerifier = async () => ({ uid: 'u', phone: '+14155550123' });
  assert.equal((await call(createAuthSyncHandler({ verifyToken: v, rpc: okRpc }))).status, 403);
});

Deno.test('400 for invalid device / body', async () => {
  const h = createAuthSyncHandler({ verifyToken: okVerifier, rpc: okRpc });
  assert.equal((await call(h, { deviceId: 'x' })).status, 400);
  assert.equal((await h(new Request('https://f.test', { method: 'POST', headers: { authorization: `Bearer ${TOKEN}` }, body: '{bad' }))).status, 400);
});

Deno.test('maps database errors without leaking details', async () => {
  const mk = (message: string): Rpc => async () => ({ data: null, error: { message } });
  assert.equal((await call(createAuthSyncHandler({ verifyToken: okVerifier, rpc: mk('account_suspended') }))).status, 403);
  assert.equal((await call(createAuthSyncHandler({ verifyToken: okVerifier, rpc: mk('phone_conflict') }))).status, 409);
  const res = await call(createAuthSyncHandler({ verifyToken: okVerifier, rpc: mk('relation "profiles" does not exist') }));
  assert.equal(res.status, 500);
  assert.ok(!JSON.stringify(await res.json()).includes('profiles'));
  assert.equal((await call(createAuthSyncHandler({ verifyToken: okVerifier, rpc: async () => ({ data: [], error: null }) }))).status, 500);
});

Deno.test('only POST', async () => {
  const res = await createAuthSyncHandler({ verifyToken: okVerifier, rpc: okRpc })(new Request('https://f.test', { method: 'GET' }));
  assert.equal(res.status, 405);
});
