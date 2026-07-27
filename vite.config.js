import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3020,
    host: true,
    allowedHosts: true
  },
  preview: {
    port: 3020,
    host: true,
    allowedHosts: true
  }
});
