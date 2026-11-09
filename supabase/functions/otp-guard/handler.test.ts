import assert from 'node:assert/strict';
import { createOtpGuardHandler, type Rpc } from './handler.ts';

const call = (handler: (r: Request) => Promise<Response>, body: unknown, method = 'POST', headers: Record<string, string> = {}) =>
  handler(new Request('https://f.test/otp-guard', { method, headers, body: method === 'POST' ? JSON.stringify(body) : undefined }));

const GOOD = { phone: '+919876543210', deviceId: 'device-1234abcd' };

Deno.test('allowed request returns {allowed:true}; phone & device are sent only as keyed hashes', async () => {
  let args: Record<string, unknown> = {};
  const rpc: Rpc = async (name, a) => {
    assert.equal(name, 'check_and_log_otp_request');
    args = a;
    return { data: [{ allowed: true, retry_after_sec: 0 }], error: null };
  };
  const res = await call(createOtpGuardHandler({ rpc, pepper: 'pep' }), GOOD, 'POST', { 'x-forwarded-for': '203.0.113.9' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { allowed: true, retryAfterSec: 0 });
  assert.match(String(args.p_phone_hash), /^[0-9a-f]{64}$/);
  assert.match(String(args.p_device_hash), /^[0-9a-f]{64}$/);
  assert.equal(args.p_ip, '203.0.113.9');
  assert.ok(!JSON.stringify(args).includes('9876543210'));
});

Deno.test('denied request surfaces retryAfterSec', async () => {
  const rpc: Rpc = async () => ({ data: [{ allowed: false, retry_after_sec: 4200 }], error: null });
  const res = await call(createOtpGuardHandler({ rpc, pepper: 'p' }), GOOD);
  assert.deepEqual(await res.json(), { allowed: false, retryAfterSec: 4200 });
});

Deno.test('fails CLOSED when the database errors or returns nothing', async () => {
  for (const rpc of [
    (async () => ({ data: null, error: { message: 'connection refused' } })) as Rpc,
    (async () => ({ data: [], error: null })) as Rpc,
    (async () => ({ data: [{ allowed: 'yes' }], error: null })) as Rpc,
  ]) {
    const res = await call(createOtpGuardHandler({ rpc, pepper: 'p' }), GOOD);
    assert.equal(res.status, 503);
    assert.ok(!JSON.stringify(await res.json()).includes('connection refused'));
  }
});

Deno.test('rejects bad input without touching the database', async () => {
  let touched = false;
  const rpc: Rpc = async () => ((touched = true), { data: [], error: null });
  const h = createOtpGuardHandler({ rpc, pepper: 'p' });
  for (const bad of [{}, { phone: '+14155550123', deviceId: 'device-1234abcd' }, { phone: '+919876543210', deviceId: 'x' }, { phone: 5, deviceId: 'device-1234abcd' }]) {
    assert.equal((await call(h, bad)).status, 400);
  }
  assert.equal((await h(new Request('https://f.test', { method: 'POST', body: '{not json' }))).status, 400);
  assert.equal((await h(new Request('https://f.test', { method: 'POST', body: 'x'.repeat(9000) }))).status, 400);
  assert.equal(touched, false);
});

Deno.test('only POST is allowed', async () => {
  const res = await call(createOtpGuardHandler({ rpc: async () => ({ data: [], error: null }), pepper: 'p' }), null, 'GET');
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('allow'), 'POST');
});
