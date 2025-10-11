/**
 * @file Vite build configuration
 */

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
