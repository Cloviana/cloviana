import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import nextVitals from 'eslint-config-next/core-web-vitals';

import legacyConfig from './.eslintrc.cjs';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  { ignores: ['**/*.css', '**/*.md', '**/*.svg'] },
  ...nextVitals,
  ...compat.config(legacyConfig),
];
