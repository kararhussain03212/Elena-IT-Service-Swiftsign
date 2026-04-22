import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import fs from "fs"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rewriteApiToPhpRoute = (rawPath) => {
  const [pathname, search = ""] = rawPath.split("?")
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`
  return `/public/index.php?route=${encodeURIComponent(normalizedPath)}${search ? `&${search}` : ""}`
}
const rewriteUploadsPath = (rawPath) => {
  const [pathname, search = ""] = rawPath.split("?")
  let decodedPathname = pathname
  try {
    decodedPathname = decodeURIComponent(pathname)
  } catch {
    decodedPathname = pathname
  }
  const relativeUploadPath = decodedPathname.replace(/^\/+uploads\//i, "")
  const backendRoot = path.resolve(__dirname, "../backend")
  const publicUploadFile = path.join(backendRoot, "public", "uploads", relativeUploadPath)
  const legacyUploadFile = path.join(backendRoot, "uploads", relativeUploadPath)

  let basePath = pathname
  if (relativeUploadPath !== decodedPathname && fs.existsSync(publicUploadFile)) {
    basePath = `/public${pathname}`
  } else if (relativeUploadPath !== decodedPathname && fs.existsSync(legacyUploadFile)) {
    basePath = pathname
  } else if (relativeUploadPath !== decodedPathname) {
    basePath = `/public${pathname}`
  }

  return `${basePath}${search ? `?${search}` : ""}`
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const configuredBase = (env.VITE_PUBLIC_BASE || "/").trim()
  const normalizedBase = configuredBase.startsWith("/") ? configuredBase : `/${configuredBase}`
  const base = normalizedBase.endsWith("/") ? normalizedBase : `${normalizedBase}/`

  return ({
  base: mode === 'production' ? base : '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: rewriteApiToPhpRoute,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: rewriteUploadsPath,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "node:process": "process/browser",
      process: "process/browser",
    },
    dedupe: ['react', 'react-dom', 'react-router-dom']
  },
  define: {
    "process.env": {},
  },
})
})
