import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const bail = Number(process.env.VITEST_BAIL ?? 15)

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    bail,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
