import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { include: ['chatgpt/**/*.test.ts'] },
  build: {
    outDir: 'dist/server', emptyOutDir: true,
    lib: { entry: 'chatgpt/server.ts', formats: ['es'], fileName: () => 'index.js' },
    target: 'es2022', minify: false,
  },
})
