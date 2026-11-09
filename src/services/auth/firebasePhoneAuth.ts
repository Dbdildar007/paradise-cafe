import auth from '@react-native-firebase/auth';
import { OTP_POLICY } from '../../features/otp/otpPolicy';
import type { PhoneAuthService } from '../../features/otp/types';
import { mapFirebaseError } from './authErrors';

/**
 * Firebase Phone Authentication (OTP) - the only place that talks to Firebase Auth.
 *  - Android: Firebase auto-retrieves the SMS (no SMS permission needed) -> `onAutoVerified`
 *  - iOS: the one-time code is suggested above the keyboard (textContentType="oneTimeCode")
 */
export const firebasePhoneAuth: PhoneAuthService = {
  start(phoneE164, forceResend, events) {
    let active = true;
    const listener = auth().verifyPhoneNumber(phoneE164, OTP_POLICY.autoVerifyTimeoutSec, forceResend);
    listener.on(
      'state_changed',
      snapshot => {
        if (!active) {
          return;
        }
        switch (snapshot.state) {
          case 'sent':
            events.onCodeSent(snapshot.verificationId);
            break;
          case 'verified':
            if (snapshot.code) {
              events.onAutoVerified({ code: snapshot.code, verificationId: snapshot.verificationId });
            } else {
              events.onInstantSignIn();
            }
            break;
          case 'error':
            events.onError(mapFirebaseError(snapshot.error));
            break;
          default:
            break; // 'timeout': auto-retrieval window ended - the user can still type the code
        }
      },
      error => {
        if (active) {
          events.onError(mapFirebaseError(error));
        }
      },
    );
    return {
      cancel: () => {
        active = false;
      },
    };
  },

  async confirm(verificationId, code) {
    const credential = auth.PhoneAuthProvider.credential(verificationId, code);
    const result = await auth().signInWithCredential(credential);
    return { idToken: await result.user.getIdToken(), isNewUser: !!result.additionalUserInfo?.isNewUser };
  },

  async currentIdToken() {
    const user = auth().currentUser;
    return user ? { idToken: await user.getIdToken(), isNewUser: false } : null;
  },

  async signOut() {
    await auth().signOut();
  },
};

/** Used by bootstrap: Firebase persists the session itself (Keychain on iOS, encrypted prefs on Android). */
export const hasFirebaseSession = (): boolean => {
  try {
    return auth().currentUser != null;
  } catch {
    return false; // Firebase not configured yet (missing google-services.json) - treat as signed out
  }
};

export const getFreshIdToken = async (): Promise<string | null> => {
  const user = auth().currentUser;
  return user ? user.getIdToken() : null;
};
