import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Local QA artifacts (screenshots, headless Chrome profiles) must never
  // trigger HMR reloads while the site is being reviewed.
  server: {
    watch: { ignored: ['**/.shots/**', '**/dist/**'] },
  },
  build: {
    target: 'es2022',
    cssTarget: 'chrome110',
    chunkSizeWarningLimit: 1400,
  },
})
