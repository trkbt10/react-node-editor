/**
 * @file Vite build configuration
 */
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { analyzer } from "vite-bundle-analyzer";
import { terser as rollupTerser } from "rollup-plugin-terser";
import type { RollupTerserOptions } from "rollup-plugin-terser";
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

export default defineConfig(({ mode }) => {
  const terserOptions: RollupTerserOptions = {
    compress: {
      ecma: 2020,
      module: true,
      passes: 3,
    },
    format: {
      comments: false,
    },
    mangle: {
      safari10: true,
      toplevel: true,
    },
    module: true,
  } as const;

  const plugins: PluginOption[] = [
    react(),
    dts({
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
        "src/**/*.stories.tsx",
        "src/examples/**/*",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
      ],
      rollupTypes: true,
      insertTypesEntry: true,
      copyDtsFiles: true,
      strictOutput: true,
      logLevel: "error",
    }),
    dedupeLibraryCss(),
  ];

  if (mode === "analyze") {
    plugins.push(
      analyzer({
        summary: true,
      }),
    );
  }

  return {
    plugins,
    server: {
      allowedHosts: [".ngrok.app"],
    },
    build: {
      cssCodeSplit: false,
      lib: {
        entry: {
          index: "src/index.ts",
          "i18n/en": "src/i18n/en.ts",
          "i18n/ja": "src/i18n/ja.ts",
          "i18n/zh": "src/i18n/zh.ts",
          "i18n/zh-cn": "src/i18n/zh-cn.ts",
          "i18n/ko": "src/i18n/ko.ts",
          "i18n/es": "src/i18n/es.ts",
          "i18n/fr": "src/i18n/fr.ts",
          "i18n/de": "src/i18n/de.ts",
          "i18n/types": "src/i18n/types.ts",
        },
        name: "NodeEditor",
        formats: ["es", "cjs"],
        fileName: (format, entryName) => {
          const normalizedEntryName = entryName ?? "index";
          if (format === "es") {
            return `${normalizedEntryName}.js`;
          }
          if (format === "cjs") {
            return `${normalizedEntryName}.cjs`;
          }
          return `${normalizedEntryName}.${format}.js`;
        },
      },
      outDir: "dist",
      rollupOptions: {
        external: [/node:.+/, "react", "react-dom", "react/jsx-runtime"],
        plugins: [rollupTerser(terserOptions)],
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
  };
});
