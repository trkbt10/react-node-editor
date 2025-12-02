/**
 * @file Script to automatically generate theme exports in package.json
 *
 * Reads from themes-catalog.json as the single source of truth.
 */
import { readFileSync, writeFileSync } from "node:fs";

import themesCatalog from "./themes-catalog.json";

const PACKAGE_JSON_PATH = "package.json";

type ThemeCatalogEntry = {
  id: string;
  label: string;
  description: string;
  cssFile: string | null;
};

function generateThemeExports(): void {
  const themes = themesCatalog.themes as ThemeCatalogEntry[];

  // Filter themes that have CSS files (exclude default)
  const themesWithCss = themes.filter(
    (theme): theme is ThemeCatalogEntry & { cssFile: string } =>
      theme.cssFile !== null
  );

  if (themesWithCss.length === 0) {
    throw new Error("No themes with CSS files found in catalog");
  }

  // Read package.json
  const packageJsonContent = readFileSync(PACKAGE_JSON_PATH, "utf-8");
  const packageJson = JSON.parse(packageJsonContent);

  if (!packageJson.exports) {
    throw new Error("package.json does not have an exports field");
  }

  // Remove existing theme exports (keep non-theme exports)
  const newExports: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(packageJson.exports)) {
    if (!key.startsWith("./themes/")) {
      newExports[key] = value;
    }
  }

  // Generate new theme exports from catalog
  const themeExports: Record<string, string> = {};
  for (const theme of themesWithCss.sort((a, b) =>
    a.cssFile.localeCompare(b.cssFile)
  )) {
    const exportKey = `./themes/${theme.cssFile}`;
    const exportPath = `./public/themes/${theme.cssFile}`;
    themeExports[exportKey] = exportPath;
  }

  // Insert theme exports after style.css export
  const finalExports: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(newExports)) {
    finalExports[key] = value;
    // Insert theme exports after "./style.css"
    if (key === "./style.css") {
      Object.assign(finalExports, themeExports);
    }
  }

  // Update package.json
  packageJson.exports = finalExports;

  // Write back to package.json with proper formatting
  writeFileSync(
    PACKAGE_JSON_PATH,
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf-8"
  );

  console.log(
    `✅ Generated ${themesWithCss.length} theme exports in package.json`
  );
  console.log("\nThemes processed (from catalog):");
  for (const theme of themesWithCss.sort((a, b) =>
    a.cssFile.localeCompare(b.cssFile)
  )) {
    console.log(`  - ${theme.cssFile} (${theme.label})`);
  }
}

try {
  generateThemeExports();
} catch (error) {
  console.error("❌ Error generating theme exports:", error);
  process.exit(1);
}
