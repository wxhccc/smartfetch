import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    coverage: {
      reporter: ['html', 'json']
    }
    // setupFiles: ['./vitest-setup.ts']
  }
})