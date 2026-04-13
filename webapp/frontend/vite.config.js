import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3070,
    proxy: {
      '/api': {
        target: 'http://localhost:5070',
        changeOrigin: true,
      },
    },
  },
})
