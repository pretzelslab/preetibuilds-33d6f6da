import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: true,
    },
    proxy: {
      // Regex key (leading "^"): proxy API calls to the local function server,
      // but NOT /api/_lib/* — those are shared source modules (e.g.
      // api/_lib/pageCodes.ts imported by PageGate) that Vite itself must serve
      // in dev. Proxying them blanked the whole app.
      "^/api/(?!_lib/)": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
