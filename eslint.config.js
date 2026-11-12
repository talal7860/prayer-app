// https://docs.expo.dev/guides/using-eslint/
const {defineConfig} = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // The codebase uses `type` for object shapes; keep it consistent instead of switching to `interface`.
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // `onPress={() => setX(v)}` is the normal React handler shape; braces add nothing there.
      '@typescript-eslint/no-confusing-void-expression': ['error', {ignoreArrowShorthand: true}],
      // Numbers in template literals (`${minutes} min`, `${deg}°`) are intended and always format fine.
      '@typescript-eslint/restrict-template-expressions': ['error', {allowNumber: true}],
    },
  },
  {
    files: ['__tests__/**'],
    rules: {
      // jest.mock factories can't use imports (they're hoisted above them), so they `require()`.
      '@typescript-eslint/no-require-imports': 'off',
      // jest.mock calls are written above the imports they mock, for readability (babel-jest hoists them anyway).
      'import/first': 'off',
      // Mocked modules and jest.requireActual are untyped (`any`) by nature.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // Fixtures are known to exist; a failing `!` throws, which fails the test as it should.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // `await act(async () => ...)` flushes pending promises even when the callback doesn't await.
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['*.config.js', 'babel.config.js', 'metro.config.js', 'jest.globalSetup.js'],
    languageOptions: {globals: globals.node},
  },
  {
    files: ['jest.setup.js'],
    languageOptions: {globals: globals.jest},
  },
  {
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  // Last, so it turns off any formatting rules the configs above enable.
  prettierConfig,
  {
    // `.claude/` holds other git worktrees of this repo.
    ignores: ['dist/*', 'ios/*', 'android/*', 'coverage/*', '.expo/*', '.claude/*'],
  },
]);
