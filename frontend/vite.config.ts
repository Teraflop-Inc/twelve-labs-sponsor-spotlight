import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

// The vendored TwelveLabs design system lives at src/tlds and is aliased to
// `@twelvelabs-io/react` so app imports match the published package — swapping
// to the real GitHub Packages build later is a one-line alias removal.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@twelvelabs-io/react": path.resolve(__dirname, "src/tlds/index.ts"),
      // The vendored design system imports its internals via "@/…"; point that
      // at the library root. App code uses relative imports + the alias above.
      "@": path.resolve(__dirname, "src/tlds"),
    },
  },
  server: {
    port: 5173,
    // Dev: forward API calls to the FastAPI backend (uvicorn on :8001).
    proxy: {
      "/api": { target: "http://127.0.0.1:8001", changeOrigin: true },
    },
  },
  build: {
    // Emit a self-contained static bundle that FastAPI serves at "/" in prod.
    outDir: path.resolve(__dirname, "../backend/webapp"),
    emptyOutDir: true,
  },
})
