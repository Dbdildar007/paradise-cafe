const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const defaultConfig = getDefaultConfig(__dirname);

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: { experimentalImportSupport: false, inlineRequires: true },
    }),
    minifierConfig: {
      compress: { drop_console: true, passes: 2 },
      mangle: { toplevel: false },
    },
  },
  resolver: {
    // Exclude the nested navigation assets causing the image size crash
    blocklist: exclusionList([
      /node_modules\/@react-navigation\/native-stack\/node_modules\/@react-navigation\/elements\/lib\/module\/assets\/.*/,
      /node_modules\/@react-navigation\/elements\/lib\/module\/assets\/.*/,
    ]),
  },
};

module.exports = mergeConfig(defaultConfig, config);