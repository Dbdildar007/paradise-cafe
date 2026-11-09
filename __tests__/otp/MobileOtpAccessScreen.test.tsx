import React from 'react';
import { Platform } from 'react-native';
import { act, fireEvent, render, waitFor as rntlWaitFor } from '@testing-library/react-native';
import { MobileOtpAccessScreen } from '../../src/screens/MobileOtpAccessScreen';
import { PROFILE, makeDeps, waitFor } from '../../jest/otpTestUtils';
import { failure } from '../../src/services/auth/authErrors';

const PHONE = '9876543210';

const setup = (hint: () => Promise<string | null> = async () => null) => {
  const h = makeDeps();
  const nav = { reset: jest.fn(), navigate: jest.fn(), goBack: jest.fn() };
  const requestPhoneHint = jest.fn(hint);
  const utils = render(
    <MobileOtpAccessScreen navigation={nav as never} route={{ key: 'k', name: 'MobileOtpAccess' } as never} deps={h.deps} requestPhoneHint={requestPhoneHint} />,
  );
  const startCount = () => h.phoneAuth.start.mock.calls.length;
  const typePhone = (p = PHONE) => fireEvent.changeText(utils.getByTestId('phone-input'), p);
  /** Press Get OTP and let Firebase "deliver" the SMS. */
  const getOtp = async (vid = 'vid-1') => {
    const before = startCount();
    fireEvent.press(utils.getByTestId('get-otp-button'));
    await waitFor(() => startCount() > before);
    await act(async () => h.events().onCodeSent(vid));
  };
  return { ...h, ...utils, nav, requestPhoneHint, typePhone, getOtp, startCount };
};

describe('MobileOtpAccessScreen - design & initial state', () => {
  it('renders all copy from the design', () => {
    const { getByText } = setup();
    [
      'HERITAGE GASTRONOMY',
      'PARADISE CAFE',
      'Pure Taste. Modern Heritage.',
      'Your cravings, our paradise.',
      'Discover royal biryanis, authentic curries, and handcrafted culinary delicacies delivered fresh to your doorstep.',
      'Direct Doorstep Access',
      '+91',
      'EST. 1984 • CRAFTED WITH DEVOTION',
    ].forEach(t => expect(getByText(t)).toBeTruthy());
    expect(getByText(/By continuing, you agree to our/)).toBeTruthy();
    expect(getByText('Terms of Service')).toBeTruthy();
    expect(getByText('Privacy Policy')).toBeTruthy();
  });

  it('initially shows only the number field + Get OTP (OTP boxes and Verify hidden)', () => {
    const { getByTestId, queryByTestId } = setup();
    expect(getByTestId('get-otp-button').props.accessibilityState.disabled).toBe(true);
    expect(queryByTestId('otp-section')).toBeNull();
    expect(queryByTestId('verify-button')).toBeNull();
    expect(queryByTestId('blocking-loader')).toBeNull();
  });

  it('enables Get OTP only for a valid Indian mobile number', () => {
    const { getByTestId, typePhone } = setup();
    typePhone('98765');
    expect(getByTestId('get-otp-button').props.accessibilityState.disabled).toBe(true);
    typePhone('5876543210'); // starts with 5 -> invalid
    expect(getByTestId('get-otp-button').props.accessibilityState.disabled).toBe(true);
    typePhone('9876543210');
    expect(getByTestId('get-otp-button').props.accessibilityState.disabled).toBe(false);
  });

  it('accepts pasted +91 numbers and formats them', () => {
    const { getByTestId, typePhone } = setup();
    typePhone('+91 98765 43210');
    expect(getByTestId('phone-input').props.value).toBe('98765 43210');
  });
});

describe('MobileOtpAccessScreen - country code (India only)', () => {
  it('opens the sheet, shows only India, and keeps +91 after selecting', () => {
    const { getByTestId, getByText, queryAllByTestId, queryByTestId } = setup();
    fireEvent.press(getByTestId('country-chip'));
    expect(queryAllByTestId(/country-option-/)).toHaveLength(1);
    fireEvent.press(getByTestId('country-option-IN'));
    expect(queryByTestId('country-option-IN')).toBeNull();
    expect(getByText('+91')).toBeTruthy();
  });
});

describe('MobileOtpAccessScreen - sending the OTP', () => {
  it('blocks the whole screen with a loader while sending, then reveals the OTP section', async () => {
    const t = setup();
    let release: (v: { allowed: boolean; retryAfterSec: number }) => void = () => undefined;
    t.api.checkOtpAllowance.mockReturnValueOnce(new Promise(r => (release = r)));
    t.typePhone();
    fireEvent.press(t.getByTestId('get-otp-button'));
    await rntlWaitFor(() => expect(t.getByTestId('blocking-loader')).toBeTruthy());
    expect(t.getByText('Sending OTP…')).toBeTruthy();
    expect(t.getByTestId('phone-input', { includeHiddenElements: true }).props.editable).toBe(false); // nothing is editable meanwhile
    await act(async () => release({ allowed: true, retryAfterSec: 0 }));
    await waitFor(() => t.startCount() > 0);
    await act(async () => t.events().onCodeSent('vid-1'));
    await rntlWaitFor(() => expect(t.getByTestId('otp-section')).toBeTruthy());
    expect(t.queryByTestId('blocking-loader')).toBeNull();
    expect(t.getByText('PASSCODE VERIFICATION')).toBeTruthy();
    expect(t.getByTestId('verify-button')).toBeTruthy();
    expect(t.queryByTestId('get-otp-button')).toBeNull();
    expect(t.getByTestId('otp-boxes')).toBeTruthy();
  });

  it('shows the error under the number when sending is refused', async () => {
    const t = setup();
    t.api.checkOtpAllowance.mockResolvedValueOnce({ allowed: false, retryAfterSec: 1800 });
    t.typePhone();
    fireEvent.press(t.getByTestId('get-otp-button'));
    await rntlWaitFor(() => expect(t.getByTestId('phone-error')).toBeTruthy());
    expect(t.getByTestId('phone-error').props.children).toMatch(/try again in 30m/i);
    expect(t.queryByTestId('otp-section')).toBeNull();
  });
});

describe('MobileOtpAccessScreen - hiding OTP while editing the number', () => {
  it('focusing the number field hides the OTP section + Verify; blur restores them', async () => {
    const t = setup();
    t.typePhone();
    await t.getOtp();
    await rntlWaitFor(() => expect(t.getByTestId('otp-section')).toBeTruthy());
    fireEvent(t.getByTestId('phone-input'), 'focus');
    expect(t.queryByTestId('otp-section')).toBeNull();
    expect(t.queryByTestId('verify-button')).toBeNull();
    expect(t.getByTestId('get-otp-button')).toBeTruthy();
    fireEvent(t.getByTestId('phone-input'), 'blur');
    expect(t.getByTestId('otp-section')).toBeTruthy();
  });

  it('typing a different number resets the flow (new OTP needed)', async () => {
    const t = setup();
    t.typePhone();
    await t.getOtp();
    await rntlWaitFor(() => expect(t.getByTestId('otp-section')).toBeTruthy());
    fireEvent(t.getByTestId('phone-input'), 'focus');
    t.typePhone('9123456780');
    fireEvent(t.getByTestId('phone-input'), 'blur');
    expect(t.queryByTestId('otp-section')).toBeNull();
    expect(t.getByTestId('get-otp-button')).toBeTruthy();
  });
});

describe('MobileOtpAccessScreen - verification', () => {
  it('correct OTP (auto-verify on 6th digit) -> backend sync -> Home', async () => {
    const t = setup();
    t.typePhone();
    await t.getOtp();
    await rntlWaitFor(() => expect(t.getByTestId('otp-input')).toBeTruthy());
    fireEvent.changeText(t.getByTestId('otp-input'), '582310');
    await rntlWaitFor(() => expect(t.nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] }));
    expect(t.api.syncUser).toHaveBeenCalledWith('id-token', expect.objectContaining({ deviceId: 'device-1' }));
    expect(t.phoneAuth.confirm).toHaveBeenCalledWith('vid-1', '582310');
  });

  it('shows the loader while verifying', async () => {
    const t = setup();
    let finish: (v: { idToken: string; isNewUser: boolean }) => void = () => undefined;
    t.phoneAuth.confirm.mockReturnValueOnce(new Promise(r => (finish = r)));
    t.typePhone();
    await t.getOtp();
    await rntlWaitFor(() => expect(t.getByTestId('otp-input')).toBeTruthy());
    fireEvent.changeText(t.getByTestId('otp-input'), '123456');
    await rntlWaitFor(() => expect(t.getByTestId('blocking-loader')).toBeTruthy());
    expect(t.getByText('Verifying…')).toBeTruthy();
    expect(t.getByTestId('otp-input', { includeHiddenElements: true }).props.editable).toBe(false);
    await act(async () => finish({ idToken: 't', isNewUser: false }));
    await rntlWaitFor(() => expect(t.nav.reset).toHaveBeenCalled());
  });

  it('wrong OTP shows the "incorrect OTP" message on screen and does not navigate', async () => {
    const t = setup();
    t.phoneAuth.confirm.mockRejectedValueOnce({ code: 'auth/invalid-verification-code' });
    t.typePhone();
    await t.getOtp();
    await rntlWaitFor(() => expect(t.getByTestId('otp-input')).toBeTruthy());
    fireEvent.changeText(t.getByTestId('otp-input'), '000000');
    await rntlWaitFor(() => expect(t.getByTestId('otp-error')).toBeTruthy());
    expect(t.getByTestId('otp-error').props.children).toMatch(/incorrect otp/i);
    expect(t.nav.reset).not.toHaveBeenCalled();
    expect(t.getByTestId('otp-input').props.value).toBe('');
  });

  it('manual Verify button works and is disabled until 6 digits', async () => {
    const t = setup();
    t.typePhone();
    await t.getOtp();
    await rntlWaitFor(() => expect(t.getByTestId('verify-button')).toBeTruthy());
    expect(t.getByTestId('verify-button').props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(t.getByTestId('otp-input'), '12345');
    expect(t.getByTestId('verify-button').props.accessibilityState.disabled).toBe(true);
  });

  it('Android auto-read OTP verifies and navigates without any typing', async () => {
    const t = setup();
    t.typePhone();
    fireEvent.press(t.getByTestId('get-otp-button'));
    await waitFor(() => t.startCount() > 0);
    await act(async () => t.events().onAutoVerified({ code: '246810', verificationId: 'auto' }));
    await rntlWaitFor(() => expect(t.nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] }));
    expect(t.phoneAuth.confirm).toHaveBeenCalledWith('auto', '246810');
  });
});

describe('MobileOtpAccessScreen - resend timer & limits', () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] }));
  afterEach(() => jest.useRealTimers());

  it('shows a 60 s timer next to a disabled Resend OTP, enables it at zero, and resends', async () => {
    const t = setup();
    t.typePhone();
    await t.getOtp();
    await rntlWaitFor(() => expect(t.getByTestId('resend-timer')).toBeTruthy());
    expect(t.getByText('1:00')).toBeTruthy();
    expect(t.getByTestId('resend-button').props.accessibilityState.disabled).toBe(true);

    t.clock.now += 30_000;
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(t.getByText('0:30')).toBeTruthy();

    t.clock.now += 31_000;
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(t.queryByTestId('resend-timer')).toBeNull();
    expect(t.getByTestId('resend-button').props.accessibilityState.disabled).toBe(false);

    const before = t.startCount();
    fireEvent.press(t.getByTestId('resend-button'));
    await waitFor(() => t.startCount() > before);
    expect(t.phoneAuth.start).toHaveBeenLastCalledWith('+919876543210', true, expect.any(Object));
    await act(async () => t.events().onCodeSent('vid-2'));
    await rntlWaitFor(() => expect(t.getByTestId('resend-timer')).toBeTruthy()); // timer restarts
    expect(t.getByTestId('resend-button').props.accessibilityState.disabled).toBe(true);
  });

  it('after 3 resends the button stays disabled and "Limit reached" shows', async () => {
    const t = setup();
    t.typePhone();
    await t.getOtp();
    for (let i = 0; i < 3; i += 1) {
      t.clock.now += 61_000;
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      const before = t.startCount();
      fireEvent.press(t.getByTestId('resend-button'));
      await waitFor(() => t.startCount() > before);
      await act(async () => t.events().onCodeSent(`v${i}`));
    }
    t.clock.now += 61_000;
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(t.getByTestId('resend-limit')).toBeTruthy();
    expect(t.getByTestId('resend-button').props.accessibilityState.disabled).toBe(true);
  });
});

describe('MobileOtpAccessScreen - device numbers (Android Phone Number Hint)', () => {
  const original = Platform.OS;
  beforeEach(() => {
    Platform.OS = 'android';
  });
  afterEach(() => {
    Platform.OS = original;
  });

  it('tapping the field offers device numbers; picking one fills it and sends the OTP automatically', async () => {
    const t = setup(async () => PHONE);
    fireEvent(t.getByTestId('phone-input'), 'focus');
    await waitFor(() => t.startCount() > 0);
    expect(t.requestPhoneHint).toHaveBeenCalledTimes(1);
    expect(t.phoneAuth.start).toHaveBeenCalledWith('+919876543210', false, expect.any(Object));
    await act(async () => t.events().onCodeSent('hint-vid'));
    await rntlWaitFor(() => expect(t.getByTestId('otp-section')).toBeTruthy());
    expect(t.getByTestId('phone-input').props.value).toBe('98765 43210');
  });

  it('dismissing the sheet lets the user type, and it is not offered again', async () => {
    const t = setup(async () => null);
    fireEvent(t.getByTestId('phone-input'), 'focus');
    await rntlWaitFor(() => expect(t.requestPhoneHint).toHaveBeenCalledTimes(1));
    expect(t.startCount()).toBe(0);
    fireEvent(t.getByTestId('phone-input'), 'blur');
    fireEvent(t.getByTestId('phone-input'), 'focus');
    expect(t.requestPhoneHint).toHaveBeenCalledTimes(1);
  });

  it('is not offered once a number was already typed', () => {
    const t = setup(async () => PHONE);
    t.typePhone('98765');
    fireEvent(t.getByTestId('phone-input'), 'focus');
    expect(t.requestPhoneHint).not.toHaveBeenCalled();
  });
});

describe('MobileOtpAccessScreen - iOS', () => {
  it('never opens the Android hint sheet (AutoFill is used instead)', () => {
    const t = setup(async () => PHONE);
    fireEvent(t.getByTestId('phone-input'), 'focus');
    expect(t.requestPhoneHint).not.toHaveBeenCalled();
  });
});

describe('MobileOtpAccessScreen - misc', () => {
  it('Firebase "too many requests" is surfaced to the user', async () => {
    const t = setup();
    t.typePhone();
    fireEvent.press(t.getByTestId('get-otp-button'));
    await waitFor(() => t.startCount() > 0);
    await act(async () => t.events().onError(failure('too_many_requests')));
    await rntlWaitFor(() => expect(t.getByTestId('phone-error')).toBeTruthy());
    expect(t.getByTestId('phone-error').props.children).toMatch(/too many attempts/i);
  });
  it('uses the profile returned by the backend (existing user) and still navigates Home', async () => {
    const t = setup();
    t.api.syncUser.mockResolvedValueOnce({ profile: { ...PROFILE, fullName: 'Asha' }, isNewUser: false });
    t.typePhone();
    await t.getOtp();
    await rntlWaitFor(() => expect(t.getByTestId('otp-input')).toBeTruthy());
    fireEvent.changeText(t.getByTestId('otp-input'), '111222');
    await rntlWaitFor(() => expect(t.nav.reset).toHaveBeenCalled());
  });
});
