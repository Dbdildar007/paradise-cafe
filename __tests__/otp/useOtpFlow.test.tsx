import { act, renderHook } from '@testing-library/react-native';
import { initialOtpState, otpReducer, useOtpFlow, type OtpState } from '../../src/features/otp/useOtpFlow';
import { ApiError } from '../../src/services/api/httpClient';
import { failure } from '../../src/services/auth/authErrors';
import { makeDeps, PROFILE, waitFor } from '../../jest/otpTestUtils';

const PHONE = '9876543210';

const setup = () => {
  const h = makeDeps();
  const onAuthenticated = jest.fn();
  const hook = renderHook(() => useOtpFlow({ deps: h.deps, onAuthenticated }));
  const startCount = () => h.phoneAuth.start.mock.calls.length;

  /** Runs requestOtp and resolves it by simulating Firebase delivering the SMS. */
  const send = async (kind: 'send' | 'resend' = 'send', verificationId = 'vid-1') => {
    const before = startCount();
    await act(async () => {
      const p = hook.result.current.requestOtp(kind);
      await waitFor(() => startCount() > before);
      h.events().onCodeSent(verificationId);
      await p;
    });
  };
  const typePhone = async (p = PHONE) => {
    await act(async () => hook.result.current.setPhone(p));
  };
  return { ...h, hook, onAuthenticated, send, typePhone, startCount };
};

describe('otpReducer', () => {
  it('PHONE_CHANGED resets everything except the number', () => {
    const dirty = { ...initialOtpState, phase: 'otp' as const, verificationId: 'v', otp: '12', error: 'x', attemptsLeft: 1 };
    expect(otpReducer(dirty, { type: 'PHONE_CHANGED', phone: '98' })).toEqual({ ...initialOtpState, phone: '98' });
  });
  it('invalid code decrements attempts, clears the code and locks at zero', () => {
    let s: OtpState = { ...initialOtpState, phase: 'verifying', attemptsLeft: 2, otp: '111111' };
    s = otpReducer(s, { type: 'VERIFY_FAILED', failure: failure('invalid_code') });
    expect(s).toMatchObject({ phase: 'otp', otp: '', attemptsLeft: 1 });
    expect(s.otpError).toMatch(/incorrect otp/i);
    s = otpReducer(s, { type: 'VERIFY_FAILED', failure: failure('invalid_code') });
    expect(s.attemptsLeft).toBe(0);
    expect(s.otpError).toMatch(/resend otp/i);
  });
  it('expired code disables verify and frees the resend button', () => {
    const s = otpReducer({ ...initialOtpState, cooldownUntil: 9e12, phase: 'verifying' }, { type: 'VERIFY_FAILED', failure: failure('expired') });
    expect(s).toMatchObject({ attemptsLeft: 0, cooldownUntil: 0, phase: 'otp' });
  });
  it('OTP_SENT keeps phase verifying when auto-verify already started', () => {
    const s = otpReducer({ ...initialOtpState, phase: 'verifying', otp: '123456' }, { type: 'OTP_SENT', verificationId: 'v', cooldownUntil: 1, resendsLeft: 3 });
    expect(s).toMatchObject({ phase: 'verifying', otp: '123456', verificationId: 'v' });
  });
  it('SEND_FAILED returns to otp when a code was already sent, else to phone', () => {
    expect(otpReducer({ ...initialOtpState, phase: 'sending' }, { type: 'SEND_FAILED', message: 'm' }).phase).toBe('phone');
    expect(otpReducer({ ...initialOtpState, phase: 'sending', verificationId: 'v' }, { type: 'SEND_FAILED', message: 'm' }).phase).toBe('otp');
  });
  it('ignores unknown actions', () => {
    expect(otpReducer(initialOtpState, { type: 'NOPE' } as never)).toBe(initialOtpState);
  });
});

describe('useOtpFlow - sending the OTP', () => {
  it('rejects an invalid number without any network call', async () => {
    const t = setup();
    await t.typePhone('12345');
    await act(async () => t.hook.result.current.requestOtp('send'));
    expect(t.hook.result.current.state.error).toMatch(/valid 10-digit/i);
    expect(t.api.checkOtpAllowance).not.toHaveBeenCalled();
    expect(t.startCount()).toBe(0);
  });

  it('send: guard -> limiter -> Firebase -> OTP phase with 60 s cooldown', async () => {
    const t = setup();
    await t.typePhone();
    expect(t.hook.result.current.canGetOtp).toBe(true);
    await t.send();
    const { state } = t.hook.result.current;
    expect(t.api.checkOtpAllowance).toHaveBeenCalledWith('+919876543210', 'device-1');
    expect(t.phoneAuth.start).toHaveBeenCalledWith('+919876543210', false, expect.any(Object));
    expect(state).toMatchObject({ phase: 'otp', verificationId: 'vid-1', resendsLeft: 3, cooldownUntil: t.clock.now + 60_000 });
  });

  it('a second tap while sending is ignored (single flight)', async () => {
    const t = setup();
    await t.typePhone();
    await act(async () => {
      const a = t.hook.result.current.requestOtp('send');
      const b = t.hook.result.current.requestOtp('send');
      await waitFor(() => t.startCount() > 0);
      t.events().onCodeSent('v');
      await Promise.all([a, b]);
    });
    expect(t.startCount()).toBe(1);
  });

  it('server guard denial blocks the SMS and is not counted', async () => {
    const t = setup();
    t.api.checkOtpAllowance.mockResolvedValueOnce({ allowed: false, retryAfterSec: 3600 });
    await t.typePhone();
    await act(async () => t.hook.result.current.requestOtp('send'));
    expect(t.hook.result.current.state.error).toMatch(/try again in 1h 0m/);
    expect(t.startCount()).toBe(0);
    expect((await t.limiter.status('+919876543210')).sends).toBe(0);
  });

  it('server guard unreachable fails closed with a network message', async () => {
    const t = setup();
    t.api.checkOtpAllowance.mockRejectedValueOnce(new ApiError(0, 'network', 'x'));
    await t.typePhone();
    await act(async () => t.hook.result.current.requestOtp('send'));
    expect(t.hook.result.current.state.error).toMatch(/internet/i);
    expect(t.startCount()).toBe(0);
  });

  it('Firebase error before the code is sent is shown and the phase returns to phone', async () => {
    const t = setup();
    await t.typePhone();
    await act(async () => {
      const p = t.hook.result.current.requestOtp('send');
      await waitFor(() => t.startCount() > 0);
      t.events().onError(failure('too_many_requests'));
      await p;
    });
    expect(t.hook.result.current.state).toMatchObject({ phase: 'phone', error: expect.stringMatching(/too many attempts/i) });
  });

  it('editing the number mid-flow cancels the session and resets', async () => {
    const t = setup();
    await t.typePhone();
    await t.send();
    await t.typePhone('9876543211');
    expect(t.cancel).toHaveBeenCalled();
    expect(t.hook.result.current.state).toMatchObject({ phase: 'phone', verificationId: null, otp: '' });
  });

  it('unmount cancels the Firebase listener', async () => {
    const t = setup();
    await t.typePhone();
    await t.send();
    t.hook.unmount();
    expect(t.cancel).toHaveBeenCalled();
  });
});

describe('useOtpFlow - resend rules (60 s timer, 3 per 5 h)', () => {
  it('blocks resend during the cooldown without calling Firebase', async () => {
    const t = setup();
    await t.typePhone();
    await t.send();
    const before = t.startCount();
    await act(async () => t.hook.result.current.requestOtp('resend'));
    expect(t.startCount()).toBe(before);
    expect(t.hook.result.current.state.error).toMatch(/wait for the timer/i);
  });

  it('resend after 60 s sends a new OTP with forceResend', async () => {
    const t = setup();
    await t.typePhone();
    await t.send();
    t.clock.now += 61_000;
    await t.send('resend', 'vid-2');
    expect(t.phoneAuth.start).toHaveBeenLastCalledWith('+919876543210', true, expect.any(Object));
    expect(t.hook.result.current.state).toMatchObject({ verificationId: 'vid-2', resendsLeft: 2, attemptsLeft: 5 });
  });

  it('allows 3 resends then blocks with a retry-after message', async () => {
    const t = setup();
    await t.typePhone();
    await t.send();
    for (let i = 0; i < 3; i += 1) {
      t.clock.now += 61_000;
      await t.send('resend', `vid-${i + 2}`);
    }
    expect(t.hook.result.current.state.resendsLeft).toBe(0);
    t.clock.now += 61_000;
    const before = t.startCount();
    await act(async () => t.hook.result.current.requestOtp('resend'));
    expect(t.startCount()).toBe(before);
    expect(t.hook.result.current.state.error).toMatch(/Too many OTP requests for this number\. Try again in 4h/);
  });

  it('the limit is per number and survives editing the number back', async () => {
    const t = setup();
    await t.typePhone();
    await t.send();
    for (let i = 0; i < 3; i += 1) {
      t.clock.now += 61_000;
      await t.send('resend', `v${i}`);
    }
    await t.typePhone('9123456780');
    await t.typePhone(PHONE);
    await act(async () => t.hook.result.current.requestOtp('send'));
    expect(t.hook.result.current.state.error).toMatch(/Too many OTP requests/);
  });
});

describe('useOtpFlow - verification', () => {
  it('correct code -> confirm -> backend sync -> onAuthenticated (new user)', async () => {
    const t = setup();
    await t.typePhone();
    await t.send();
    await act(async () => t.hook.result.current.setOtp('123456')); // auto-verifies on the 6th digit
    await waitFor(() => t.onAuthenticated.mock.calls.length > 0);
    expect(t.phoneAuth.confirm).toHaveBeenCalledWith('vid-1', '123456');
    expect(t.api.syncUser).toHaveBeenCalledWith('id-token', { deviceId: 'device-1', platform: 'android', appVersion: '1.0.0' });
    expect(t.onAuthenticated).toHaveBeenCalledWith({ profile: PROFILE, isNewUser: true });
    expect((await t.limiter.status('+919876543210')).cooldownUntil).toBe(0);
  });

  it('returning user: isNewUser false from the backend is respected', async () => {
    const t = setup();
    t.api.syncUser.mockResolvedValueOnce({ profile: PROFILE, isNewUser: false });
    await t.typePhone();
    await t.send();
    await act(async () => t.hook.result.current.setOtp('123456'));
    await waitFor(() => t.onAuthenticated.mock.calls.length > 0);
    expect(t.onAuthenticated).toHaveBeenCalledWith({ profile: PROFILE, isNewUser: false });
  });

  it('manual verify requires all 6 digits', async () => {
    const t = setup();
    await t.typePhone();
    await t.send();
    await act(async () => t.hook.result.current.setOtp('123'));
    expect(t.hook.result.current.canVerify).toBe(false);
    await act(async () => t.hook.result.current.verify());
    expect(t.phoneAuth.confirm).not.toHaveBeenCalled();
  });

  it('wrong OTP shows the message, clears the boxes and counts attempts; 5 wrong locks verify', async () => {
    const t = setup();
    t.phoneAuth.confirm.mockRejectedValue({ code: 'auth/invalid-verification-code' });
    await t.typePhone();
    await t.send();
    await act(async () => t.hook.result.current.setOtp('000000'));
    await waitFor(() => t.hook.result.current.state.attemptsLeft === 4);
    expect(t.hook.result.current.state).toMatchObject({ phase: 'otp', otp: '', otpError: expect.stringMatching(/incorrect otp/i) });
    expect(t.onAuthenticated).not.toHaveBeenCalled();
    for (let i = 0; i < 4; i += 1) {
      await act(async () => t.hook.result.current.setOtp('111111'));
      await waitFor(() => t.hook.result.current.state.attemptsLeft === 3 - i);
    }
    expect(t.hook.result.current.state.otpError).toMatch(/resend otp/i);
    const calls = t.phoneAuth.confirm.mock.calls.length;
    await act(async () => t.hook.result.current.verify('222222'));
    expect(t.phoneAuth.confirm.mock.calls.length).toBe(calls); // locked
  });

  it('expired code asks for a resend', async () => {
    const t = setup();
    t.phoneAuth.confirm.mockRejectedValueOnce({ code: 'auth/code-expired' });
    await t.typePhone();
    await t.send();
    await act(async () => t.hook.result.current.setOtp('123456'));
    await waitFor(() => t.hook.result.current.state.attemptsLeft === 0);
    expect(t.hook.result.current.state.otpError).toMatch(/expired/i);
    expect(t.hook.result.current.state.cooldownUntil).toBe(0);
  });

  it('Android auto-retrieval: SMS read automatically -> verified without typing', async () => {
    const t = setup();
    await t.typePhone();
    await act(async () => {
      const p = t.hook.result.current.requestOtp('send');
      await waitFor(() => t.startCount() > 0);
      t.events().onAutoVerified({ code: '654321', verificationId: 'auto-vid' });
      await p;
    });
    await waitFor(() => t.onAuthenticated.mock.calls.length > 0);
    expect(t.phoneAuth.confirm).toHaveBeenCalledWith('auto-vid', '654321');
  });

  it('Android instant verification (no SMS) completes sign-in', async () => {
    const t = setup();
    await t.typePhone();
    await act(async () => {
      const p = t.hook.result.current.requestOtp('send');
      await waitFor(() => t.startCount() > 0);
      t.events().onInstantSignIn();
      await p;
    });
    await waitFor(() => t.onAuthenticated.mock.calls.length > 0);
    expect(t.phoneAuth.confirm).not.toHaveBeenCalled();
    expect(t.phoneAuth.currentIdToken).toHaveBeenCalled();
  });

  it('instant verification without a user shows an error', async () => {
    const t = setup();
    t.phoneAuth.currentIdToken.mockResolvedValueOnce(null);
    await t.typePhone();
    await act(async () => {
      const p = t.hook.result.current.requestOtp('send');
      await waitFor(() => t.startCount() > 0);
      t.events().onInstantSignIn();
      await p;
    });
    await waitFor(() => !!t.hook.result.current.state.otpError);
    expect(t.onAuthenticated).not.toHaveBeenCalled();
  });

  it('profile sync failure keeps the code; Verify retries ONLY the sync (no second confirm)', async () => {
    const t = setup();
    t.api.syncUser.mockRejectedValueOnce(new ApiError(503, 'x', 'x'));
    await t.typePhone();
    await t.send();
    await act(async () => t.hook.result.current.setOtp('123456'));
    await waitFor(() => !!t.hook.result.current.state.otpError);
    expect(t.hook.result.current.state.otpError).toMatch(/could not finish signing you in/i);
    expect(t.hook.result.current.state.otp).toBe('123456');
    expect(t.hook.result.current.canVerify).toBe(true);
    await act(async () => t.hook.result.current.verify());
    await waitFor(() => t.onAuthenticated.mock.calls.length > 0);
    expect(t.phoneAuth.confirm).toHaveBeenCalledTimes(1);
    expect(t.phoneAuth.currentIdToken).toHaveBeenCalled();
  });

  it('retry after sync failure when the Firebase session vanished asks for a new OTP', async () => {
    const t = setup();
    t.api.syncUser.mockRejectedValueOnce(new ApiError(0, 'network', 'x'));
    t.phoneAuth.currentIdToken.mockResolvedValueOnce(null);
    await t.typePhone();
    await t.send();
    await act(async () => t.hook.result.current.setOtp('123456'));
    await waitFor(() => !!t.hook.result.current.state.otpError);
    await act(async () => t.hook.result.current.verify());
    await waitFor(() => /expired/i.test(t.hook.result.current.state.otpError ?? ''));
  });

  it('device number: fills the number and sends the OTP automatically', async () => {
    const t = setup();
    await act(async () => {
      t.hook.result.current.submitDevicePhone(PHONE);
      await waitFor(() => t.startCount() > 0);
      t.events().onCodeSent('hint-vid');
    });
    await waitFor(() => t.hook.result.current.state.phase === 'otp');
    expect(t.hook.result.current.state.phone).toBe(PHONE);
    expect(t.phoneAuth.start).toHaveBeenCalledWith('+919876543210', false, expect.any(Object));
  });
});
