import { useCallback, useEffect, useReducer, useRef } from 'react';
import { ApiError } from '../../services/api/httpClient';
import { failure, mapFirebaseError } from '../../services/auth/authErrors';
import { formatRetryAfter } from './countdown';
import { defaultOtpDeps } from './defaultDeps';
import { OTP_POLICY } from './otpPolicy';
import { digitsOnly, isValidIndianMobile, normalizeIndianMobile, toE164 } from './phone';
import type { AuthFailure, OtpDeps, SyncResult } from './types';

export type Phase = 'phone' | 'sending' | 'otp' | 'verifying';

export type OtpState = {
  phase: Phase;
  phone: string; // 10 national digits
  otp: string;
  error: string | null; // phone / sending level
  otpError: string | null; // verification level (wrong / expired code)
  verificationId: string | null;
  cooldownUntil: number;
  attemptsLeft: number;
  resendsLeft: number;
};

type Action =
  | { type: 'PHONE_CHANGED'; phone: string }
  | { type: 'OTP_CHANGED'; otp: string }
  | { type: 'SENDING' }
  | { type: 'SEND_FAILED'; message: string }
  | { type: 'OTP_SENT'; verificationId: string; cooldownUntil: number; resendsLeft: number }
  | { type: 'VERIFYING'; otp: string }
  | { type: 'VERIFY_FAILED'; failure: AuthFailure };

export const initialOtpState: OtpState = {
  phase: 'phone',
  phone: '',
  otp: '',
  error: null,
  otpError: null,
  verificationId: null,
  cooldownUntil: 0,
  attemptsLeft: OTP_POLICY.maxVerifyAttempts,
  resendsLeft: OTP_POLICY.maxResends,
};

export const otpReducer = (state: OtpState, action: Action): OtpState => {
  switch (action.type) {
    case 'PHONE_CHANGED':
      // Editing the number invalidates any OTP flow in progress.
      return { ...initialOtpState, phone: action.phone };
    case 'OTP_CHANGED':
      return { ...state, otp: action.otp, otpError: null };
    case 'SENDING':
      return { ...state, phase: 'sending', error: null, otpError: null };
    case 'SEND_FAILED':
      return { ...state, phase: state.verificationId ? 'otp' : 'phone', error: action.message };
    case 'OTP_SENT':
      return {
        ...state,
        phase: state.phase === 'verifying' ? 'verifying' : 'otp', // auto-verify may already be running
        verificationId: action.verificationId,
        cooldownUntil: action.cooldownUntil,
        resendsLeft: action.resendsLeft,
        otp: state.phase === 'verifying' ? state.otp : '',
        attemptsLeft: OTP_POLICY.maxVerifyAttempts,
        error: null,
        otpError: null,
      };
    case 'VERIFYING':
      return { ...state, phase: 'verifying', otp: action.otp, otpError: null, error: null };
    case 'VERIFY_FAILED': {
      const { kind, message } = action.failure;
      if (kind === 'invalid_code') {
        const left = Math.max(0, state.attemptsLeft - 1);
        return {
          ...state,
          phase: 'otp',
          otp: '',
          attemptsLeft: left,
          otpError: left === 0 ? 'Too many incorrect attempts. Please tap Resend OTP for a new code.' : message,
        };
      }
      if (kind === 'expired') {
        return { ...state, phase: 'otp', otp: '', attemptsLeft: 0, cooldownUntil: 0, otpError: message };
      }
      if (kind === 'sync_failed') {
        return { ...state, phase: 'otp', otpError: message }; // keep the code; Verify retries the profile sync only
      }
      return { ...state, phase: 'otp', otp: '', otpError: message };
    }
    default:
      return state;
  }
};

const toFailure = (e: unknown): AuthFailure =>
  e instanceof ApiError ? failure(e.status === 0 ? 'network' : 'unknown') : mapFirebaseError(e);

type Options = { deps?: OtpDeps; onAuthenticated: (result: SyncResult) => void };

export const useOtpFlow = ({ deps = defaultOtpDeps, onAuthenticated }: Options) => {
  const [state, dispatch] = useReducer(otpReducer, initialOtpState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const session = useRef<{ cancel: () => void } | null>(null);
  const verificationIdRef = useRef<string | null>(null);
  const busy = useRef(false); // single-flight guard for send
  const verifying = useRef(false); // single-flight guard for verify
  const pendingSync = useRef<{ isNewUser: boolean } | null>(null);
  const mounted = useRef(true);
  const onAuthRef = useRef(onAuthenticated);
  onAuthRef.current = onAuthenticated;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      session.current?.cancel();
    };
  }, []);

  const safeDispatch = useCallback((a: Action) => {
    if (mounted.current) {
      dispatch(a);
    }
  }, []);

  const finishLogin = useCallback(
    async (idToken: string, isNewUser: boolean) => {
      const deviceId = await deps.getDeviceId();
      const result = await deps.api.syncUser(idToken, deps.getSyncContext(deviceId));
      pendingSync.current = null;
      await deps.limiter.clearCooldown(toE164(stateRef.current.phone)).catch(() => undefined);
      onAuthRef.current({ ...result, isNewUser: result.isNewUser ?? isNewUser });
    },
    [deps],
  );

  const verifyWith = useCallback(
    async (verificationId: string, code: string) => {
      if (verifying.current) {
        return;
      }
      verifying.current = true;
      safeDispatch({ type: 'VERIFYING', otp: code });
      try {
        let tokens: { idToken: string; isNewUser: boolean } | null;
        if (pendingSync.current) {
          tokens = await deps.phoneAuth.currentIdToken(); // already signed in: only the profile sync failed earlier
        } else {
          try {
            tokens = await deps.phoneAuth.confirm(verificationId, code);
          } catch (e) {
            safeDispatch({ type: 'VERIFY_FAILED', failure: mapFirebaseError(e) });
            return;
          }
        }
        if (!tokens) {
          pendingSync.current = null;
          safeDispatch({ type: 'VERIFY_FAILED', failure: failure('expired') });
          return;
        }
        try {
          await finishLogin(tokens.idToken, tokens.isNewUser);
        } catch {
          pendingSync.current = { isNewUser: tokens.isNewUser };
          safeDispatch({ type: 'VERIFY_FAILED', failure: failure('sync_failed') });
        }
      } finally {
        verifying.current = false;
      }
    },
    [deps, finishLogin, safeDispatch],
  );

  const instantVerify = useCallback(async () => {
    if (verifying.current) {
      return;
    }
    verifying.current = true;
    safeDispatch({ type: 'VERIFYING', otp: '' });
    try {
      const tokens = await deps.phoneAuth.currentIdToken();
      if (!tokens) {
        safeDispatch({ type: 'VERIFY_FAILED', failure: failure('unknown') });
        return;
      }
      await finishLogin(tokens.idToken, tokens.isNewUser);
    } catch {
      safeDispatch({ type: 'VERIFY_FAILED', failure: failure('sync_failed') });
    } finally {
      verifying.current = false;
    }
  }, [deps, finishLogin, safeDispatch]);

  /** kind 'send' = first OTP, 'resend' = another OTP for the same number. */
  const requestOtp = useCallback(
    async (kind: 'send' | 'resend' = 'send', phoneOverride?: string) => {
      if (busy.current || verifying.current) {
        return;
      }
      const phone = phoneOverride ?? stateRef.current.phone;
      if (!isValidIndianMobile(phone)) {
        safeDispatch({ type: 'SEND_FAILED', message: failure('invalid_phone').message });
        return;
      }
      const e164 = toE164(phone);
      busy.current = true;
      safeDispatch({ type: 'SENDING' });
      try {
        const status = await deps.limiter.status(e164);
        if (status.blocked) {
          safeDispatch({
            type: 'SEND_FAILED',
            message: `Too many OTP requests for this number. Try again in ${formatRetryAfter(status.retryAfterMs)}.`,
          });
          return;
        }
        if (kind === 'resend' && status.cooldownUntil > deps.now()) {
          safeDispatch({ type: 'SEND_FAILED', message: 'Please wait for the timer before requesting another OTP.' });
          return;
        }

        const deviceId = await deps.getDeviceId();
        const allowance = await deps.api.checkOtpAllowance(e164, deviceId); // server-side guard (fails closed)
        if (!allowance.allowed) {
          safeDispatch({
            type: 'SEND_FAILED',
            message: `Too many OTP requests. Please try again in ${formatRetryAfter(allowance.retryAfterSec * 1000)}.`,
          });
          return;
        }

        const recorded = await deps.limiter.recordSend(e164); // count it before the SMS goes out
        session.current?.cancel();
        pendingSync.current = null;

        await new Promise<void>((resolve, reject) => {
          let settled = false;
          const settle = (fn: () => void) => {
            if (!settled) {
              settled = true;
              fn();
            }
          };
          session.current = deps.phoneAuth.start(e164, kind === 'resend' && !!verificationIdRef.current, {
            onCodeSent: id => {
              verificationIdRef.current = id;
              settle(resolve);
            },
            onAutoVerified: ({ code, verificationId }) => {
              verificationIdRef.current = verificationId;
              settle(resolve);
              void verifyWith(verificationId, code); // Android: SMS read automatically -> verify immediately
            },
            onInstantSignIn: () => {
              settle(resolve);
              void instantVerify();
            },
            onError: f => {
              if (settled) {
                safeDispatch({ type: 'VERIFY_FAILED', failure: f });
              } else {
                settle(() => reject(f));
              }
            },
          });
        });

        safeDispatch({
          type: 'OTP_SENT',
          verificationId: verificationIdRef.current ?? '',
          cooldownUntil: recorded.cooldownUntil,
          resendsLeft: recorded.resendsLeft,
        });
      } catch (e) {
        const f = (e as AuthFailure)?.kind ? (e as AuthFailure) : toFailure(e);
        safeDispatch({ type: 'SEND_FAILED', message: f.message });
      } finally {
        busy.current = false;
      }
    },
    [deps, instantVerify, safeDispatch, verifyWith],
  );

  const setPhone = useCallback(
    (text: string) => {
      const phone = normalizeIndianMobile(text);
      if (phone !== stateRef.current.phone) {
        session.current?.cancel();
        verificationIdRef.current = null;
        pendingSync.current = null;
        dispatch({ type: 'PHONE_CHANGED', phone });
      }
    },
    [],
  );

  const verify = useCallback(
    (codeOverride?: string) => {
      const s = stateRef.current;
      const id = verificationIdRef.current;
      const code = codeOverride ?? s.otp;
      if (!id || s.attemptsLeft <= 0 || s.phase === 'verifying' || s.phase === 'sending') {
        return;
      }
      if (!pendingSync.current && code.length !== OTP_POLICY.length) {
        return;
      }
      void verifyWith(id, code);
    },
    [verifyWith],
  );

  const setOtp = useCallback(
    (text: string) => {
      const otp = digitsOnly(text).slice(0, OTP_POLICY.length);
      dispatch({ type: 'OTP_CHANGED', otp });
      if (otp.length === OTP_POLICY.length) {
        verify(otp); // Zomato-style: verify as soon as the 6th digit is entered
      }
    },
    [verify],
  );

  /** A number picked from the device (Android Phone Number Hint): fill it in and send the OTP automatically. */
  const submitDevicePhone = useCallback(
    (digits: string) => {
      setPhone(digits);
      void requestOtp('send', digits);
    },
    [requestOtp, setPhone],
  );

  const busyNow = state.phase === 'sending' || state.phase === 'verifying';
  const canGetOtp = isValidIndianMobile(state.phone) && !busyNow;
  const canVerify =
    !busyNow &&
    state.phase === 'otp' &&
    !!state.verificationId &&
    state.attemptsLeft > 0 &&
    (state.otp.length === OTP_POLICY.length || !!pendingSync.current);

  return { state, busy: busyNow, canGetOtp, canVerify, setPhone, setOtp, requestOtp, verify, submitDevicePhone };
};
