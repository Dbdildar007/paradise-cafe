(globalThis as { __DEV__?: boolean }).__DEV__ = true;

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly' },
  SECURITY_LEVEL: { SECURE_HARDWARE: 'SECURE_HARDWARE' },
  STORAGE_TYPE: { AES_GCM: 'KeystoreAESGCM' },
  setGenericPassword: jest.fn().mockResolvedValue({ service: 's', storage: 'keychain' }),
  getGenericPassword: jest.fn().mockResolvedValue(false),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('jail-monkey', () => ({
  __esModule: true,
  default: {
    isJailBroken: jest.fn(() => false),
    hookDetected: jest.fn(() => false),
    isDebuggedMode: jest.fn().mockResolvedValue(false),
    canMockLocation: jest.fn(() => false),
  },
}));

jest.mock('react-native-ssl-public-key-pinning', () => ({
  initializeSslPinning: jest.fn().mockResolvedValue(undefined),
  addSslPinningErrorListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('@react-native-community/netinfo', () => {
  const state = { isConnected: true, isInternetReachable: true };
  return {
    __esModule: true,
    default: {
      addEventListener: jest.fn((cb: (s: typeof state) => void) => {
        cb(state);
        return jest.fn();
      }),
      refresh: jest.fn().mockResolvedValue(state),
    },
  };
});

jest.mock('@react-native-community/blur', () => {
  const { View } = require('react-native');
  const R = require('react');
  return { BlurView: (p: object) => R.createElement(View, p) };
});

jest.mock('react-native-linear-gradient', () => {
  const { View } = require('react-native');
  const R = require('react');
  return { __esModule: true, default: (p: object) => R.createElement(View, p) };
});

jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  const R = require('react');
  const stub = (p: object) => R.createElement(View, p);
  return {
    __esModule: true,
    default: stub,
    Svg: stub,
    Circle: stub,
    Path: stub,
    Rect: stub,
    Defs: stub,
    Stop: stub,
    RadialGradient: stub,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: unknown }) => children,
    SafeAreaView: ({ children }: { children: unknown }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    SafeAreaInsetsContext: require('react').createContext(inset),
    initialWindowMetrics: { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: inset },
  };
});

jest.mock('@react-native-firebase/auth', () => {
  const instance = {
    verifyPhoneNumber: jest.fn(),
    signInWithCredential: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
    currentUser: null as null | { getIdToken: () => Promise<string> },
  };
  const authFn: jest.Mock & { PhoneAuthProvider?: unknown } = jest.fn(() => instance);
  authFn.PhoneAuthProvider = { credential: jest.fn((verificationId: string, code: string) => ({ verificationId, code })) };
  return { __esModule: true, default: authFn };
});

jest.mock('react-native-sms-retriever', () => ({
  __esModule: true,
  default: {
    requestPhoneNumber: jest.fn().mockResolvedValue('+919876543210'),
    startSmsRetriever: jest.fn().mockResolvedValue(true),
    addSmsListener: jest.fn().mockResolvedValue(true),
    removeSmsListener: jest.fn(),
  },
}));
