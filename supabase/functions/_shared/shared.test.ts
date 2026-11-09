import assert from 'node:assert/strict';
import { hmacSha256Hex } from './crypto.ts';
import { errorJson, readJson } from './http.ts';
import { bearerToken, clientIp, isDeviceId, isIndianE164, parseAppVersion, parsePlatform } from './validation.ts';

Deno.test('isIndianE164 accepts only +91 mobiles starting 6-9', () => {
  assert.equal(isIndianE164('+919876543210'), true);
  for (const bad of ['+915876543210', '+14155550123', '9876543210', '+91987654321', '+9198765432101', '', null, 5]) {
    assert.equal(isIndianE164(bad), false, String(bad));
  }
});

Deno.test('isDeviceId', () => {
  assert.equal(isDeviceId('abcd1234-ef56'), true);
  for (const bad of ['short', 'has space 1234', "x'; drop table--", 'a'.repeat(129), undefined]) {
    assert.equal(isDeviceId(bad), false, String(bad));
  }
});

Deno.test('platform / version parsing', () => {
  assert.equal(parsePlatform('ios'), 'ios');
  assert.equal(parsePlatform('android'), 'android');
  assert.equal(parsePlatform('windows'), 'other');
  assert.equal(parseAppVersion('1.2.3'), '1.2.3');
  assert.equal(parseAppVersion('<script>'), null);
});

Deno.test('clientIp only trusts well-formed addresses', () => {
  const r = (h?: string) => new Request('https://x.test', { headers: h ? { 'x-forwarded-for': h } : {} });
  assert.equal(clientIp(r('203.0.113.7, 10.0.0.1')), '203.0.113.7');
  assert.equal(clientIp(r('2001:db8::1')), '2001:db8::1');
  assert.equal(clientIp(r("1.1.1.1'; drop table x;--")), null);
  assert.equal(clientIp(r('not an ip')), null);
  assert.equal(clientIp(r()), null);
});

Deno.test('bearerToken', () => {
  const r = (h?: string) => new Request('https://x.test', { headers: h ? { authorization: h } : {} });
  assert.equal(bearerToken(r('Bearer abcdefghijklmnopqrstuvwxyz.123')), 'abcdefghijklmnopqrstuvwxyz.123');
  assert.equal(bearerToken(r('Bearer short')), null);
  assert.equal(bearerToken(r('Basic abcdefghijklmnopqrstuvwxyz')), null);
  assert.equal(bearerToken(r()), null);
});

Deno.test('hmacSha256Hex is deterministic, keyed and one-way', async () => {
  const a = await hmacSha256Hex('pepper', 'phone:+919876543210');
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, await hmacSha256Hex('pepper', 'phone:+919876543210'));
  assert.notEqual(a, await hmacSha256Hex('other-pepper', 'phone:+919876543210'));
  assert.ok(!a.includes('9876543210'));
});

Deno.test('http helpers', async () => {
  const res = errorJson(400, 'x', 'y');
  assert.equal(res.status, 400);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await res.json(), { error: { code: 'x', message: 'y' } });
  await assert.rejects(readJson(new Request('https://x.test', { method: 'POST', body: 'x'.repeat(5000) })), /payload_too_large/);
  assert.deepEqual(await readJson(new Request('https://x.test', { method: 'POST', body: '{"a":1}' })), { a: 1 });
});
