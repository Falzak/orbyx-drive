import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Continue build even if there are TypeScript errors
    emptyOutDir: true,
    // Ignore certain warnings during build
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore certain warnings
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        if (warning.code === "CIRCULAR_DEPENDENCY") return;
        if (warning.code === "UNUSED_EXTERNAL_IMPORT") return;

        // Use default for everything else
        warn(warning);
      },
    },
  },
}));
