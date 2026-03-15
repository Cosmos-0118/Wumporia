import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (
            id.includes('/react/') ||
            id.includes('react-dom') ||
            id.includes('react-router-dom') ||
            id.includes('@remix-run/router') ||
            id.includes('/history/')
          ) {
            return 'framework'
          }

          if (id.includes('framer-motion') || id.includes('gsap')) {
            return 'motion'
          }

          if (id.includes('comlink')) {
            return 'workers'
          }

          return undefined
        },
      },
    },
  },
})
