import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The API is proxied so the browser sees one origin and no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
});
