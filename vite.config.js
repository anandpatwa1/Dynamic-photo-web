import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

// Helper to auto-read backend PORT from server/.env
const getBackendPort = () => {
  try {
    const envPath = path.resolve(__dirname, '../server/.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^PORT\s*=\s*(\d+)/m);
      if (match?.[1]) return match[1];
    }
  } catch {}
  return '5100';
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendPort = env.VITE_BACKEND_PORT || getBackendPort();
  const backendTarget = env.VITE_API_PROXY_TARGET || `http://localhost:${backendPort}`;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5174,
      strictPort: true,
      proxy: {
        // Automatically targets the backend port defined in server/.env
        '/api': { target: backendTarget, changeOrigin: true },
        '/uploads': { target: backendTarget, changeOrigin: true },
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
};
});
