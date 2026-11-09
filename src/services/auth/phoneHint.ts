import { NativeModules, Platform } from 'react-native';
import { isValidIndianMobile, normalizeIndianMobile } from '../../features/otp/phone';

const { PhoneHintModule } = NativeModules;

export const requestDevicePhoneNumber = async (): Promise<string | null> => {
  // iOS doesn't support Android Play Services hints; return null so iOS uses keyboard AutoFill
  if (Platform.OS !== 'android' || !PhoneHintModule) {
    return null;
  }
  try {
    const raw = await PhoneHintModule.requestPhoneNumber();
    if (!raw) return null;
    const digits = normalizeIndianMobile(raw);
    return isValidIndianMobile(digits) ? digits : null;
  } catch (error) {
    return null;
  }
};