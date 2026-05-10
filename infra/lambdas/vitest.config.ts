import { defineConfig } from 'vitest/config'

const bail = Number(process.env.VITEST_BAIL ?? 15)

export default defineConfig({
  test: {
    bail,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
