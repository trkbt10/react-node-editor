/**
 * @file Vite build configuration
 */
import react from "@vitejs/plugin-react";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    lib: {
      entry: "src/index.ts",
      formats: ["cjs", "es"],
    },
    rollupOptions: {
      external: [/node:.+/],
    },
  },
});
