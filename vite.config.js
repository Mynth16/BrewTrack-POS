import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        timeout: 30000, // Increase timeout to 30s
        proxyTimeout: 30000,
        onError: (err, req, res) => {
          console.error('Proxy error:', err);
          res.writeHead(502, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ 
            error: 'Backend unavailable. Please refresh and try again.' 
          }));
        },
      },
    },
  },
})
