import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rewriteApiToPhpRoute = (rawPath) => {
  const [pathname, search = ''] = rawPath.split('?')
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `/index.php?route=${encodeURIComponent(normalizedPath)}${search ? `&${search}` : ''}`
}
const rewriteUploadsPath = (rawPath) => {
  const [pathname, search = ''] = rawPath.split('?')
  const encodedAssetPath = encodeURIComponent(pathname)
  return `/router.php?asset=${encodedAssetPath}${search ? `&${search}` : ''}`
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const configuredBase = (env.VITE_PUBLIC_BASE || '/admin/').trim()
  const normalizedBase = configuredBase.startsWith('/') ? configuredBase : `/${configuredBase}`
  const base = normalizedBase.endsWith('/') ? normalizedBase : `${normalizedBase}/`
  const apiProxyTarget = (env.VITE_API_PROXY_TARGET || 'http://localhost/Swift-sign-IT-php/backend/public').trim()

  return ({
  base: mode === 'production' ? base : '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        rewrite: rewriteApiToPhpRoute,
      },
      '/uploads': {
        target: apiProxyTarget,
        changeOrigin: true,
        rewrite: rewriteUploadsPath,
      },
    },
  },
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
})
})
