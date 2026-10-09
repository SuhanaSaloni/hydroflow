// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // NativeWind's global stylesheet is handled by Metro, not the resolver.
      'import/no-unresolved': ['error', { ignore: ['\\.css$'] }],
      // react-native ships Flow-annotated index.js that the static analyser
      // cannot parse; namespace-analysis adds no value here.
      'import/namespace': 'off',
    },
  },
]);
