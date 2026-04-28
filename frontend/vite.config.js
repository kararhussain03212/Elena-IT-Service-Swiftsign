import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rewriteApiToPhpRoute = (rawPath) => {
  const [pathname, search = ""] = rawPath.split("?")
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`
  return `/index.php?route=${encodeURIComponent(normalizedPath)}${search ? `&${search}` : ""}`
}
const rewriteUploadsPath = (rawPath) => {
  const [pathname, search = ""] = rawPath.split("?")
  const encodedAssetPath = encodeURIComponent(pathname)
  return `/router.php?asset=${encodedAssetPath}${search ? `&${search}` : ""}`
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiProxyTarget = (env.VITE_API_PROXY_TARGET || "http://localhost/Swift-sign-IT-php/backend/public").trim()

  return {
    // Root-domain deploy on cPanel (public_html).
    base: "/",
    build:
      mode === "production"
        ? {
            // Standard frontend build output
            outDir: "dist",
            assetsDir: "assets",
            emptyOutDir: true,
          }
        : undefined,
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: rewriteApiToPhpRoute,
        },
        "/uploads": {
          target: apiProxyTarget,
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
      dedupe: ["react", "react-dom", "react-router-dom"],
    },
    define: {
      "process.env": {},
    },
  }
})
