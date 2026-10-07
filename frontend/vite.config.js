import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = (env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '')

  return {
    plugins: [react()],
    server: {
      port: Number(process.env.PORT) || 5173,
      proxy: {
        '/api': backendUrl,
      },
    },
  }
})
