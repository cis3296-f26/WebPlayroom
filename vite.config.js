import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/WebPlayroom/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      // main.jsx only mounts <App /> into the real DOM, and test files shouldn't count toward coverage
      exclude: ['src/main.jsx', 'src/tests/**'],
      reporter: ['text', 'html'],
    },
  },
})
