import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Preserving your existing babel configuration
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  
  // CRITICAL: This section routes all /api calls to the backend running on port 3000
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // The rewrite ensures the path structure remains /api/auth/register
        rewrite: (path) => path, 
      },
    },
  },
});
