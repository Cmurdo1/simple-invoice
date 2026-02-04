import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import prerender from "@prerenderer/rollup-plugin";
import Renderer from "@prerenderer/renderer-puppeteer";
import sitemap from "vite-plugin-sitemap";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    sitemap({
      hostname: "https://honestinvoice.com",
      dynamicRoutes: ["/", "/login", "/signup", "/privacy", "/terms"],
    }),
    prerender({
      staticDir: path.join(__dirname, "dist"),
      routes: ["/", "/login", "/signup", "/privacy", "/terms"],
      renderer: new Renderer({
        renderAfterDocumentEvent: "render-event",
        headless: true,
      }),
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
