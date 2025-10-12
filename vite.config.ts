/**
 * @file Vite build configuration
 */
import react from "@vitejs/plugin-react";

import { defineConfig, type PluginOption } from "vite";

/**
 * Ensures CSS emitted during multi-format library builds is only written once across outputs.
 */
const dedupeLibraryCss = (): PluginOption => {
  const emittedSources = new Set<string>();

  return {
    apply: "build",
    enforce: "post",
    name: "node-editor:dedupe-library-css",
    generateBundle(outputOptions, bundle) {
      Object.entries(bundle).forEach(([fileName, chunk]) => {
        if (chunk.type !== "asset" || !fileName.endsWith(".css")) {
          return;
        }
        if (typeof chunk.source !== "string") {
          return;
        }
        if (emittedSources.has(chunk.source)) {
          delete bundle[fileName];
          return;
        }
        emittedSources.add(chunk.source);
      });
    },
  };
};

export default defineConfig({
  plugins: [react(), dedupeLibraryCss()],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: "src/index.ts",
      name: "NodeEditor",
    },
    outDir: "dist",
    rollupOptions: {
      external: [/node:.+/, "react", "react-dom", "react/jsx-runtime"],
      output: [
        {
          assetFileNames: "assets/[name]-[hash][extname]",
          chunkFileNames: "chunks/[name]-[hash].js",
          entryFileNames: "index.js",
          format: "es",
        },
        {
          assetFileNames: "assets/[name]-[hash][extname]",
          chunkFileNames: "chunks/[name]-[hash].cjs",
          entryFileNames: "index.cjs",
          exports: "named",
          format: "cjs",
        },
      ],
    },
  },
});
