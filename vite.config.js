import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Lets the SPA call same-origin `/api/...` in dev without CORS friction.
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        /**
         * Keep the heavy, rarely-changing libraries in their own cacheable
         * chunks — but split them by *which app needs them*, not just by
         * package.
         *
         * The object form this replaced listed `charts` and `motion` as named
         * chunks, which put them in the entry's import graph: every page,
         * including the marketing homepage, got a `modulepreload` for recharts
         * (~108 kB gzipped) and framer-motion (~38 kB). Neither is reachable
         * from `/`. The function form only emits a chunk when something
         * actually imports it, so those now load with the CRM and nothing else.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Shared by both apps.
          // `@remix-run/router` is react-router's own runtime — it must ride in
          // this chunk, or the router drags the catch-all `vendor` chunk (axios,
          // date-fns, …) into the marketing site's critical path.
          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id) ||
            id.includes('@remix-run')
          ) {
            return 'react';
          }
          if (id.includes('lucide-react')) return 'icons';
          // Tiny, and reached from the app root via `cn`. Without its own chunk
          // it lands in the catch-all `vendor` below and drags ~215 kB of
          // CRM-only libraries into the entry preload for the sake of ~3 kB.
          if (id.includes('clsx') || id.includes('tailwind-merge')) return 'utils';

          // CRM-only. Prefixed so a bundle check can assert none of these are
          // reachable from the site entry.
          if (id.includes('@reduxjs') || id.includes('react-redux')) return 'crm-redux';
          if (id.includes('recharts') || id.includes('d3-')) return 'crm-charts';
          if (id.includes('framer-motion')) return 'crm-motion';
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod/')) {
            return 'crm-forms';
          }

          return 'vendor';
        },
      },
    },
  },
});
