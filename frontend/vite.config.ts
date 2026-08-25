import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  server: {
    port: 3000,
    proxy: {
      '/health': 'http://127.0.0.1:8765',
      '/collections': 'http://127.0.0.1:8765',
      '/requests': 'http://127.0.0.1:8765',
      '/environments': 'http://127.0.0.1:8765',
      '/history': 'http://127.0.0.1:8765',
      '/execute': 'http://127.0.0.1:8765',
      '/execute-grpc': 'http://127.0.0.1:8765',
      '/cookies': 'http://127.0.0.1:8765',
      '/globals': 'http://127.0.0.1:8765',
      '/import-export': 'http://127.0.0.1:8765',
      '/settings': 'http://127.0.0.1:8765',
      '/git': 'http://127.0.0.1:8765',
    },
  },
})
