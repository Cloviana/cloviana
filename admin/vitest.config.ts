import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// Pure logic only (reducers, parsers): no DOM, so tests stay fast and dependency-free.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
