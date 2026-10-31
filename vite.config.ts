import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'framework',
              test: /node_modules\/(?:react|react-dom|scheduler)\//,
              priority: 20,
            },
            {
              name: 'router',
              test: /node_modules\/(?:react-router(?:-dom)?|@remix-run\/router|history)\//,
              priority: 15,
            },
            {
              name: 'motion',
              test: /node_modules\/(?:framer-motion|motion-dom|motion-utils|gsap)\//,
              priority: 10,
            },
            {
              name: 'workers',
              test: /node_modules\/comlink\//,
            },
          ],
        },
      },
    },
  },
})
