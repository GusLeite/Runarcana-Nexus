import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Repassa as chamadas da API para o Spring, evitando CORS em desenvolvimento.
    proxy: {
      '/runarcana': 'http://localhost:8080',
    },
  },
})
