/**
 * @file Visual regression tests for basic node editor components
 *
 * Tests core canvas elements: nodes, connections, and selection states.
 */
import { test, expect } from "@playwright/test";
import { listAvailableThemes } from "../src/examples/themes/registry";

const THEMES = listAvailableThemes().map((theme) => theme.id);

test.describe("Basic Components - Canvas and Nodes", () => {
  for (const theme of THEMES) {
    test(`canvas with nodes - ${theme}`, async ({ page }) => {
      await page.goto(`/?example=typed-nodes`);
      await page.waitForLoadState("networkidle");

      const themeSelector = page.locator('select[aria-label="Select theme"]');
      await themeSelector.selectOption(theme);
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot(`basic-canvas-${theme}.png`, {
        fullPage: true,
        animations: "disabled",
      });
    });
  }
});

test.describe("Basic Components - Node States", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?example=typed-nodes`);
    await page.waitForLoadState("networkidle");
  });

  test("node selected state", async ({ page }) => {
    const canvas = page.locator('[data-testid="node-editor-canvas"]');
    const node = canvas.locator("[data-node-id]").first();

    if ((await node.count()) > 0) {
      await node.click();
      await page.waitForTimeout(200);

      await expect(page).toHaveScreenshot("basic-node-selected.png", {
        fullPage: true,
        animations: "disabled",
      });
    }
  });

  test("node hover state", async ({ page }) => {
    const canvas = page.locator('[data-testid="node-editor-canvas"]');
    const node = canvas.locator("[data-node-id]").first();

    if ((await node.count()) > 0) {
      await node.hover();
      await page.waitForTimeout(200);

      await expect(page).toHaveScreenshot("basic-node-hover.png", {
        fullPage: true,
        animations: "disabled",
      });
    }
  });
});
