/**
 * Production hygiene: every console.* call is removed from release bundles so
 * nothing leaks through `adb logcat` / Xcode console. Dev and tests keep logs.
 * Policy is zero console output in production (no `exclude: ['error']`).
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};
