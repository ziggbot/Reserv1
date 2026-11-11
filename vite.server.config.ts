import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['server/**/*.test.mjs'], testTimeout: 10000 } })
