const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: { experimentalImportSupport: false, inlineRequires: true },
    }),
    // Mangle names + drop dead code in release bundles (defense in depth with Hermes bytecode).
    minifierConfig: {
      compress: { drop_console: true, passes: 2 },
      mangle: { toplevel: false },
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
