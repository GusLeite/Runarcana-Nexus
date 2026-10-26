import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Repassa as chamadas da API para o Spring, evitando CORS em desenvolvimento.
    // VITE_PROXY_TARGET aponta para outro back (ex.: o sandbox com H2 na porta 8090).
    proxy: {
      '/runarcana': process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080',
    },
  },
})
