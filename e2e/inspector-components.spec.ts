/**
 * @file Visual regression tests for inspector components across all themes
 *
 * Theme list is imported from the application's theme registry to ensure
 * tests stay in sync with available themes.
 */
import { test, expect } from "@playwright/test";
import { listAvailableThemes } from "../src/examples/themes/registry";

const THEMES = listAvailableThemes().map((theme) => theme.id);

test.describe("Inspector Components Visual Tests", () => {
  for (const theme of THEMES) {
    test(`theme: ${theme}`, async ({ page }) => {
      // Navigate to inspector components example with theme
      await page.goto(`/?example=design-inspector-components`);

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Apply theme via selector
      const themeSelector = page.locator('select[aria-label="Select theme"]');
      await themeSelector.selectOption(theme);

      // Wait for theme to apply
      await page.waitForTimeout(300);

      // Take screenshot of the full page
      await expect(page).toHaveScreenshot(`inspector-components-${theme}.png`, {
        fullPage: true,
        animations: "disabled",
      });
    });
  }
});

test.describe("Inspector Components - Interaction Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?example=design-inspector-components`);
    await page.waitForLoadState("networkidle");

    // Apply Apple theme for consistent testing
    const themeSelector = page.locator('select[aria-label="Select theme"]');
    await themeSelector.selectOption("apple");
    await page.waitForTimeout(300);
  });

  test("Input variants - all states", async ({ page }) => {
    // Click through each variant and take full page screenshots
    const variantButtons = ["Default", "Outline", "Filled"];

    for (const variant of variantButtons) {
      await page.getByRole("button", { name: variant, exact: true }).click();
      await page.waitForTimeout(100);

      await expect(page).toHaveScreenshot(
        `input-variant-${variant.toLowerCase()}.png`,
        {
          fullPage: true,
          animations: "disabled",
        }
      );
    }
  });

  test("Button group interactions", async ({ page }) => {
    // Test segment control selection - click center alignment
    const alignmentGroup = page.getByRole("group", { name: "Text alignment" }).first();
    await alignmentGroup.getByRole("button", { name: "Align center" }).click();
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot("button-group-center-selected.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("Icon button toggle", async ({ page }) => {
    // Toggle visibility button
    const visibilityButton = page.getByRole("button", {
      name: "Toggle visibility",
    });
    await visibilityButton.click();
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot("icon-button-toggled.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("Input height consistency - normal vs labeled", async ({ page }) => {
    // Get input elements
    const normalInput = page.getByTestId("input-normal");
    const labeledInput = page.getByTestId("input-with-label");

    // Get bounding boxes
    const normalBox = await normalInput.boundingBox();
    const labeledBox = await labeledInput.boundingBox();

    // Log heights for debugging
    console.log(`Normal input height: ${normalBox?.height}px`);
    console.log(`Labeled input height: ${labeledBox?.height}px`);

    // Heights should be equal (within 1px tolerance)
    expect(normalBox?.height).toBeDefined();
    expect(labeledBox?.height).toBeDefined();
    expect(Math.abs((normalBox?.height || 0) - (labeledBox?.height || 0))).toBeLessThanOrEqual(1);

    // Take screenshot of the comparison section
    const comparisonSection = page.getByTestId("input-height-comparison");
    await expect(comparisonSection).toHaveScreenshot("input-height-comparison.png", {
      animations: "disabled",
    });
  });
});
