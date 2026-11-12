import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Redirige las peticiones a /api hacia el backend Express (evita CORS en desarrollo)
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
