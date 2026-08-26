import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rawPort = process.env.PORT ?? '5173';
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/Haolasbarandlounge',

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      '@assets': path.resolve(process.cwd(), 'attached_assets'),
    },
    dedupe: ['react', 'react-dom'],
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
  },

  preview: {
    port,
    host: '0.0.0.0',
  },
});