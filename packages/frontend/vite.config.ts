import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://0.0.0.0:3000',
      '/uploads': 'http://0.0.0.0:3000',
    },
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
});
