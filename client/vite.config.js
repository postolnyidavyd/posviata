import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// У dev клієнт крутиться на 5173, а WS-сервер — на 3001.
// У проді сервер сам роздає зібраний dist, тож проксі не потрібен.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
