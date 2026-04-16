import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          router: ['react-router-dom'],
          redux: [
            '@reduxjs/toolkit', 
            'react-redux'
          ],
          charts: ['recharts'],
          icons: ['lucide-react'],
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL 
          || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => 
          path.replace(/^\/api/, '')
      }
    }
  }
})