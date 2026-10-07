/**
 * Vitest config for the Wedding Quote module tests only:
 *   npx vitest run --config vitest.wq.config.js
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    include: ['src/wedding-quote/tests/**/*.test.{js,jsx}'],
    environment: 'jsdom',
  },
});
