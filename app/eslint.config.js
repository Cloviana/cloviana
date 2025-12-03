import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import ts from '@typescript-eslint/eslint-plugin';
import { FlatCompat } from '@eslint/eslintrc';
import checkFile from 'eslint-plugin-check-file';
import reactHooks from 'eslint-plugin-react-hooks';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: [
      'node_modules/*',
      'public/mockServiceWorker.js',
      'generators/*',
      'src/features/blogs/components/editor/**/*',
    ],
  },

  js.configs.recommended,

  ...compat.extends(
    'plugin:@next/next/core-web-vitals',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended',
    'plugin:testing-library/react',
    'plugin:jest-dom/recommended',
    'plugin:vitest/legacy-recommended',
  ),

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      'check-file': checkFile,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { typescript: {} },
    },
    rules: {
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/features/blogs',
              from: './src/features',
              except: ['./blogs', './auth', './stores', './catalog'],
            },
            {
              target: './src/features/billing',
              from: './src/features',
              except: ['./billing', './auth', './stores'],
            },
            {
              target: './src/features',
              from: './src/app',
            },
            {
              target: [
                './src/components',
                './src/hooks',
                './src/lib',
                './src/types',
                './src/utils',
              ],
              from: ['./src/features', './src/app'],
            },
          ],
        },
      ],
      'import/no-cycle': 'error',
      'linebreak-style': ['error', 'unix'],
      'react/prop-types': 'off',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      '@next/next/no-page-custom-font': 'off',
      'import/no-named-as-default': 'off',
      'react/react-in-jsx-scope': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/explicit-function-return-type': ['off'],
      '@typescript-eslint/explicit-module-boundary-types': ['off'],
      '@typescript-eslint/no-empty-function': ['off'],
      '@typescript-eslint/no-explicit-any': ['off'],
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
      'react/no-unescaped-entities': 'off',
    },
  },

  {
    files: ['src/**/*'],
    plugins: {
      'check-file': checkFile,
      '@typescript-eslint': ts,
      'react-hooks': reactHooks,
    },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.{ts,tsx}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          '!(src/app)/**/*': 'KEBAB_CASE',
          '!(**/__tests__)/**/*': 'KEBAB_CASE',
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error'],
    },
  },

  {
    files: ['src/components/editor/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
