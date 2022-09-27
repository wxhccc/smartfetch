import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    dir: '__tests__',
    coverage: {
      reporter: ['html', 'json']
    },
    setupFiles: ['./vitest-setup.ts']
  }
})