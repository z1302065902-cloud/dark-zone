import { defineConfig } from 'vite'

export default defineConfig({
  // Relative base so the build works under GitHub Pages sub-path, Vercel, and itch.io
  base: './',
  build: {
    target: 'es2018',
    chunkSizeWarningLimit: 1500,
  },
})
