// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // `supabase/functions` runs on Deno: `Deno.*` globals and `npm:` specifiers
    // are not resolvable by the React Native toolchain.
    ignores: ['dist/*', 'coverage/*', '.expo/*', 'supabase/functions/**'],
  },
]);
