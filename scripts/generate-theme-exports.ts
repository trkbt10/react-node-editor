/**
 * @file Script to automatically generate theme exports in package.json
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const THEMES_DIR = "public/themes";
const PACKAGE_JSON_PATH = "package.json";

function generateThemeExports(): void {
  // Read theme files
  const themeFiles = readdirSync(THEMES_DIR).filter((file) =>
    file.endsWith(".css"),
  );

  if (themeFiles.length === 0) {
    throw new Error(`No theme files found in ${THEMES_DIR}`);
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

  // Generate new theme exports
  const themeExports: Record<string, string> = {};
  for (const themeFile of themeFiles.sort()) {
    const themeName = basename(themeFile, ".css");
    const exportKey = `./themes/${themeName}.css`;
    const exportPath = `./public/themes/${themeFile}`;
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
    "utf-8",
  );

  console.log(
    `✅ Generated ${themeFiles.length} theme exports in package.json`,
  );
  console.log("\nTheme files processed:");
  for (const themeFile of themeFiles.sort()) {
    console.log(`  - ${themeFile}`);
  }
}

try {
  generateThemeExports();
} catch (error) {
  console.error("❌ Error generating theme exports:", error);
  process.exit(1);
}
