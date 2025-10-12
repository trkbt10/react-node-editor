/**
 * @file Vite configuration for building examples for GitHub Pages
 */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist-examples",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
});
