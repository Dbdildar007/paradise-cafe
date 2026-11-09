import { ResendLimiter } from '../../src/features/otp/resendLimiter';
import { OTP_POLICY } from '../../src/features/otp/otpPolicy';
import { memoryStore } from '../../jest/otpTestUtils';

const PHONE = '+919876543210';
const make = () => {
  const store = memoryStore();
  const clock = { now: 1_000_000 };
  return { store, clock, limiter: new ResendLimiter(store, () => clock.now) };
};

describe('ResendLimiter (3 resends / 5 hours, 60 s cooldown)', () => {
  it('starts clean', async () => {
    const { limiter } = make();
    expect(await limiter.status(PHONE)).toMatchObject({ sends: 0, resendsLeft: 3, blocked: false, cooldownUntil: 0 });
  });

  it('first send is not a resend and starts the 60 s cooldown', async () => {
    const { limiter, clock } = make();
    const s = await limiter.recordSend(PHONE);
    expect(s).toMatchObject({ sends: 1, resendsLeft: 3, blocked: false, cooldownUntil: clock.now + 60_000 });
  });

  it('allows exactly 3 resends (4 sends) then blocks until the window ends', async () => {
    const { limiter, clock } = make();
    for (let i = 0; i < 4; i += 1) {
      await limiter.recordSend(PHONE);
      clock.now += 61_000;
    }
    const s = await limiter.status(PHONE);
    expect(s).toMatchObject({ sends: 4, resendsLeft: 0, blocked: true });
    expect(s.retryAfterMs).toBeGreaterThan(OTP_POLICY.windowMs - 5 * 61_000);
    expect(s.retryAfterMs).toBeLessThanOrEqual(OTP_POLICY.windowMs);
  });

  it('unblocks after the 5 h window', async () => {
    const { limiter, clock } = make();
    for (let i = 0; i < 4; i += 1) {
      await limiter.recordSend(PHONE);
    }
    expect((await limiter.status(PHONE)).blocked).toBe(true);
    clock.now += OTP_POLICY.windowMs + 1;
    expect(await limiter.status(PHONE)).toMatchObject({ blocked: false, sends: 0, resendsLeft: 3 });
    expect((await limiter.recordSend(PHONE)).sends).toBe(1); // fresh window
  });

  it('tracks numbers independently', async () => {
    const { limiter } = make();
    for (let i = 0; i < 4; i += 1) {
      await limiter.recordSend(PHONE);
    }
    expect((await limiter.status('+919123456789')).blocked).toBe(false);
  });

  it('persists across instances (app restart)', async () => {
    const { store, clock } = make();
    await new ResendLimiter(store, () => clock.now).recordSend(PHONE);
    const status = await new ResendLimiter(store, () => clock.now).status(PHONE);
    expect(status.sends).toBe(1);
  });

  it('clearCooldown keeps the counter (no bypass by re-login)', async () => {
    const { limiter } = make();
    await limiter.recordSend(PHONE);
    await limiter.clearCooldown(PHONE);
    expect(await limiter.status(PHONE)).toMatchObject({ sends: 1, cooldownUntil: 0 });
    await expect(limiter.clearCooldown('+910000000000')).resolves.toBeUndefined();
  });

  it.each(['not json', '[]', '"x"', 'null', '{"+91":{"sends":"x"}}'])('survives corrupt storage %p', async raw => {
    const { store, limiter } = make();
    await store.write(raw);
    await expect(limiter.status(PHONE)).resolves.toMatchObject({ sends: 0, blocked: false });
    await expect(limiter.recordSend(PHONE)).resolves.toMatchObject({ sends: 1 });
  });

  it('prunes expired numbers and caps the table size', async () => {
    const { store, limiter, clock } = make();
    for (let i = 0; i < 25; i += 1) {
      await limiter.recordSend(`+9198765432${String(i).padStart(2, '0')}`);
      clock.now += 1000;
    }
    expect(Object.keys(JSON.parse(store.raw() as string)).length).toBeLessThanOrEqual(20);
    clock.now += OTP_POLICY.windowMs + 1;
    await limiter.recordSend(PHONE);
    expect(Object.keys(JSON.parse(store.raw() as string))).toEqual([PHONE]);
  });
});
