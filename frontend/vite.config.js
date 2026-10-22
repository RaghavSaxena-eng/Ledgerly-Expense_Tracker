import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy libraries so the landing page loads without the chart code
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // In development, /api calls are proxied to the Express server
    proxy: {
      '/api': { target: 'http://localhost:5001', changeOrigin: true },
    },
  },
});
