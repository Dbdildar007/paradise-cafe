module.exports = {
  root: true,
  extends: '@react-native',
  parser: '@typescript-eslint/parser',
  rules: {
    // --- security & hygiene gates ---
    'no-console': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@react-native-async-storage/async-storage',
            message: 'Plain AsyncStorage is forbidden. Use src/security/secureStorage (Keychain/Keystore).',
          },
          { name: 'react-native-mmkv', message: 'Use src/security/secureStorage for sensitive data.' },
        ],
      },
    ],
    'no-restricted-globals': ['error', { name: 'localStorage', message: 'Not available / not secure.' }],
    // Responsive styles are computed from window size at runtime, so inline styles are intentional.
    'react-native/no-inline-styles': 'off',
    'no-void': ['error', { allowAsStatement: true }],
  },
  overrides: [
    { files: ['__tests__/**', 'jest/**', 'scripts/**'], rules: { 'no-console': 'off' } },
  ],
};
