/**
 * @file Check design token coverage across themes
 *
 * Parses src/global.css to extract base design tokens and compares each theme
 * file to report missing or extra token definitions.
 *
 * Uses themes-catalog.json as the source of truth for theme list.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss, { type Declaration, type Root } from "postcss";

import themesCatalog from "./themes-catalog.json";

const GLOBAL_CSS_PATH = "src/global.css";
const THEMES_DIR = "public/themes";
const TOKEN_PREFIX = "--node-editor-";

type ThemeCatalogEntry = {
  id: string;
  label: string;
  description: string;
  cssFile: string | null;
};

type TokenInfo = {
  name: string;
  value: string;
  line: number;
};

type TokenCoverageReport = {
  themeName: string;
  totalBaseTokens: number;
  coveredTokens: number;
  missingTokens: string[];
  extraTokens: string[];
  coveragePercentage: number;
};

/**
 * Extract CSS custom properties from a CSS file
 */
function extractTokens(cssContent: string): Map<string, TokenInfo> {
  const tokens = new Map<string, TokenInfo>();
  const root: Root = postcss.parse(cssContent);

  root.walkRules(":root", (rule) => {
    rule.walkDecls((decl: Declaration) => {
      if (decl.prop.startsWith(TOKEN_PREFIX)) {
        tokens.set(decl.prop, {
          name: decl.prop,
          value: decl.value,
          line: decl.source?.start?.line ?? 0,
        });
      }
    });
  });

  return tokens;
}

/**
 * Compare theme tokens against base tokens
 */
function compareTokens(
  baseTokens: Map<string, TokenInfo>,
  themeTokens: Map<string, TokenInfo>,
  themeName: string
): TokenCoverageReport {
  const missingTokens: string[] = [];
  const extraTokens: string[] = [];

  // Find missing tokens (in base but not in theme)
  for (const tokenName of baseTokens.keys()) {
    if (!themeTokens.has(tokenName)) {
      missingTokens.push(tokenName);
    }
  }

  // Find extra tokens (in theme but not in base)
  for (const tokenName of themeTokens.keys()) {
    if (!baseTokens.has(tokenName)) {
      extraTokens.push(tokenName);
    }
  }

  const coveredTokens = baseTokens.size - missingTokens.length;
  const coveragePercentage = (coveredTokens / baseTokens.size) * 100;

  return {
    themeName,
    totalBaseTokens: baseTokens.size,
    coveredTokens,
    missingTokens: missingTokens.sort(),
    extraTokens: extraTokens.sort(),
    coveragePercentage,
  };
}

const isVerbose = process.argv.includes("--verbose") || process.argv.includes("-v");
const filterTheme = process.argv.find((arg) => arg.startsWith("--theme="))?.split("=")[1];

/**
 * Format coverage report for console output
 */
function formatReport(report: TokenCoverageReport): string {
  const lines: string[] = [];
  const coverageColor =
    report.coveragePercentage === 100
      ? "\x1b[32m" // green
      : report.coveragePercentage >= 90
        ? "\x1b[33m" // yellow
        : "\x1b[31m"; // red
  const reset = "\x1b[0m";

  lines.push(
    `\n📦 ${report.themeName} ${coverageColor}(${report.coveragePercentage.toFixed(1)}% coverage)${reset}`
  );
  lines.push(
    `   Tokens: ${report.coveredTokens}/${report.totalBaseTokens} defined`
  );

  if (report.missingTokens.length > 0) {
    lines.push(`   ⚠️  Missing ${report.missingTokens.length} tokens:`);
    const tokensToShow = isVerbose ? report.missingTokens : report.missingTokens.slice(0, 10);
    for (const token of tokensToShow) {
      lines.push(`      - ${token}`);
    }
    if (!isVerbose && report.missingTokens.length > 10) {
      lines.push(
        `      ... and ${report.missingTokens.length - 10} more (use --verbose to see all)`
      );
    }
  }

  if (report.extraTokens.length > 0) {
    lines.push(`   ℹ️  Extra ${report.extraTokens.length} tokens (theme-specific):`);
    const tokensToShow = isVerbose ? report.extraTokens : report.extraTokens.slice(0, 5);
    for (const token of tokensToShow) {
      lines.push(`      + ${token}`);
    }
    if (!isVerbose && report.extraTokens.length > 5) {
      lines.push(`      ... and ${report.extraTokens.length - 5} more`);
    }
  }

  return lines.join("\n");
}

/**
 * Main function
 */
function main(): void {
  console.log("🔍 Checking design token coverage across themes...\n");

  // Read base tokens from global.css
  const globalCssContent = readFileSync(GLOBAL_CSS_PATH, "utf-8");
  const baseTokens = extractTokens(globalCssContent);
  console.log(`📄 Base tokens from ${GLOBAL_CSS_PATH}: ${baseTokens.size}`);

  // Get themes from catalog
  let themes = (themesCatalog.themes as ThemeCatalogEntry[]).filter(
    (theme): theme is ThemeCatalogEntry & { cssFile: string } =>
      theme.cssFile !== null
  );

  if (themes.length === 0) {
    console.error("❌ No themes with CSS files found in catalog");
    process.exit(1);
  }

  // Filter by theme if specified
  if (filterTheme) {
    themes = themes.filter((t) => t.id === filterTheme);
    if (themes.length === 0) {
      console.error(`❌ Theme "${filterTheme}" not found in catalog`);
      process.exit(1);
    }
    console.log(`📂 Checking theme: ${filterTheme}`);
  } else {
    console.log(`📂 Found ${themes.length} themes in catalog`);
  }

  // Analyze each theme
  const reports: TokenCoverageReport[] = [];
  let hasIssues = false;

  for (const theme of themes) {
    const themePath = join(THEMES_DIR, theme.cssFile);
    const themeContent = readFileSync(themePath, "utf-8");
    const themeTokens = extractTokens(themeContent);

    const report = compareTokens(baseTokens, themeTokens, theme.id);
    reports.push(report);

    console.log(formatReport(report));

    if (report.missingTokens.length > 0) {
      hasIssues = true;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary");
  console.log("=".repeat(60));

  const fullCoverage = reports.filter((r) => r.coveragePercentage === 100);
  const partialCoverage = reports.filter(
    (r) => r.coveragePercentage < 100 && r.coveragePercentage >= 90
  );
  const lowCoverage = reports.filter((r) => r.coveragePercentage < 90);

  console.log(`   ✅ Full coverage (100%): ${fullCoverage.length} themes`);
  console.log(`   ⚠️  Partial coverage (90-99%): ${partialCoverage.length} themes`);
  console.log(`   ❌ Low coverage (<90%): ${lowCoverage.length} themes`);

  if (lowCoverage.length > 0) {
    console.log("\n   Themes needing attention:");
    for (const report of lowCoverage) {
      console.log(
        `      - ${report.themeName}: ${report.coveragePercentage.toFixed(1)}% (${report.missingTokens.length} missing)`
      );
    }
  }

  // Exit with error if there are issues (for CI usage)
  if (hasIssues && process.argv.includes("--strict")) {
    console.log("\n❌ Token coverage check failed (strict mode)");
    process.exit(1);
  }

  console.log("\n✅ Token coverage check complete");
}

main();
