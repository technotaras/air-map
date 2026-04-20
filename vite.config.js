import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/air-map/' : '/',
  plugins: [react()],
  publicDir: resolve(import.meta.dirname, 'data'),
});
