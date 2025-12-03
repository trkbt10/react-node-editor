/**
 * @file Tests for dialogUtils positioning functions
 */
import { calculateContextMenuPosition, getViewportInfo, type ViewportInfo } from "./dialogUtils";

describe("dialogUtils", () => {
  describe("calculateContextMenuPosition", () => {
    const PADDING = 8;

    const createViewport = (width: number, height: number): ViewportInfo => ({
      width,
      height,
      scrollX: 0,
      scrollY: 0,
    });

    it("should return anchor position when menu fits within viewport", () => {
      const viewport = createViewport(1920, 1080);
      const result = calculateContextMenuPosition(100, 100, 300, 400, viewport);
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it("should adjust position when menu overflows right edge", () => {
      const viewport = createViewport(1000, 800);
      // Menu at x=900 with width=300 would overflow (900 + 300 + 8 > 1000)
      const result = calculateContextMenuPosition(900, 100, 300, 200, viewport);
      // maxX = 1000 - 300 - 8 = 692
      expect(result.x).toBe(692);
      expect(result.y).toBe(100);
    });

    it("should adjust position when menu overflows bottom edge", () => {
      const viewport = createViewport(1000, 800);
      // Menu at y=700 with height=400 would overflow (700 + 400 + 8 > 800)
      const result = calculateContextMenuPosition(100, 700, 200, 400, viewport);
      // maxY = 800 - 400 - 8 = 392
      expect(result.x).toBe(100);
      expect(result.y).toBe(392);
    });

    it("should adjust position when menu overflows both right and bottom edges", () => {
      const viewport = createViewport(1000, 800);
      const result = calculateContextMenuPosition(900, 700, 300, 400, viewport);
      // maxX = 1000 - 300 - 8 = 692
      // maxY = 800 - 400 - 8 = 392
      expect(result).toEqual({ x: 692, y: 392 });
    });

    it("should respect minimum padding from left edge", () => {
      const viewport = createViewport(1000, 800);
      const result = calculateContextMenuPosition(2, 100, 200, 200, viewport);
      expect(result.x).toBe(PADDING);
      expect(result.y).toBe(100);
    });

    it("should respect minimum padding from top edge", () => {
      const viewport = createViewport(1000, 800);
      const result = calculateContextMenuPosition(100, 2, 200, 200, viewport);
      expect(result.x).toBe(100);
      expect(result.y).toBe(PADDING);
    });

    it("should handle very large menu that exceeds viewport", () => {
      const viewport = createViewport(500, 400);
      // Menu is larger than viewport
      const result = calculateContextMenuPosition(100, 100, 600, 500, viewport);
      // maxX = 500 - 600 - 8 = -108, so should use PADDING
      // maxY = 400 - 500 - 8 = -108, so should use PADDING
      expect(result).toEqual({ x: PADDING, y: PADDING });
    });

    it("should handle position at viewport corner", () => {
      const viewport = createViewport(1000, 800);
      // Click at bottom-right corner
      const result = calculateContextMenuPosition(990, 790, 300, 400, viewport);
      // Should adjust to fit
      expect(result.x).toBeLessThanOrEqual(viewport.width - 300 - PADDING);
      expect(result.y).toBeLessThanOrEqual(viewport.height - 400 - PADDING);
    });

    it("should keep original position when clicking in center with small menu", () => {
      const viewport = createViewport(1920, 1080);
      const result = calculateContextMenuPosition(500, 400, 200, 150, viewport);
      expect(result).toEqual({ x: 500, y: 400 });
    });

    it("should handle zero-sized menu gracefully", () => {
      const viewport = createViewport(1000, 800);
      const result = calculateContextMenuPosition(100, 100, 0, 0, viewport);
      expect(result).toEqual({ x: 100, y: 100 });
    });
  });

  describe("getViewportInfo", () => {
    it("should return viewport information", () => {
      // Note: This test runs in a jsdom environment
      const result = getViewportInfo();
      expect(result).toHaveProperty("width");
      expect(result).toHaveProperty("height");
      expect(result).toHaveProperty("scrollX");
      expect(result).toHaveProperty("scrollY");
      expect(typeof result.width).toBe("number");
      expect(typeof result.height).toBe("number");
    });
  });
});
