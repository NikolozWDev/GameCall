import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
  },
  build: {
    sourcemap: false,
  },
  define: {
    __DEV__: false,
  },
})