import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/admin/' : '/',
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      'primereact/card',
      'primereact/tag',
      'primereact/button',
      'primereact/inputtext',
      'primereact/dropdown',
      'primereact/inputswitch',
      'primereact/password',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}))
