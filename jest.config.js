module.exports = {
  preset: 'react-native',
  testTimeout: 20000,
  setupFilesAfterEnv: ['<rootDir>/jest/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/supabase/functions/'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-svg|react-native-linear-gradient|@react-native-community|react-native-keychain|react-native-ssl-public-key-pinning|jail-monkey)/)',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/types/**'],
  coverageThreshold: {
    global: { statements: 85, branches: 70, functions: 80, lines: 85 },
  },
};
