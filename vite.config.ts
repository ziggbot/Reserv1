/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // Inline the four handwriting fonts (~150 kB) into the CSS so they load with
    // the stylesheet on any static host; everything else keeps the default limit.
    assetsInlineLimit: (filePath) => (filePath.endsWith('.woff2') ? true : undefined),
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
})
