
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./MINIVOETBAL.UI/test/setup.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './MINIVOETBAL.UI'),
    },
  },
})
