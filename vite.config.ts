/**
 * @file Vite build configuration
 */
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

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
  plugins: [
    react(),
    dts({
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
        "src/**/*.stories.tsx",
        "src/examples/**/*",
      ],
      rollupTypes: true,
    }),
    dedupeLibraryCss(),
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: "src/index.ts",
      name: "NodeEditor",
      formats: ["es", "cjs"],
      fileName: (format) => {
        if (format === "es") {
          return "index.js";
        }
        if (format === "cjs") {
          return "index.cjs";
        }
        return `index.${format}.js`;
      },
    },
    outDir: "dist",
    rollupOptions: {
      external: [/node:.+/, "react", "react-dom", "react/jsx-runtime"],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "style.css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
