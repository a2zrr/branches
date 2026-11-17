import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'design', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Le moteur travaille sur des copies (jamais de mutation) : delete sur une copie fraîche est sûr.
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  {
    files: ['*.config.{ts,js}', 'eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**/*.ts', '*.config.{ts,js}'],
    languageOptions: { globals: globals.node },
  },
);
