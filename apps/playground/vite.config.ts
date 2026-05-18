import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@block-canvas/core": path.resolve(__dirname, "../../packages/core/src"),
      "@block-canvas/react": path.resolve(__dirname, "../../packages/react/src"),
      "@block-canvas/components": path.resolve(
        __dirname,
        "../../packages/components/src"
      ),
      "@block-canvas/ui": path.resolve(
        __dirname,
        "../../packages/ui/src"
      ),
    },
  },
});