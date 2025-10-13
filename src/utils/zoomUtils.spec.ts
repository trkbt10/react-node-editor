/**
 * @file Tests for zoom scale utilities.
 */

import { applyZoomDelta, clampZoomScale, MAX_ZOOM_SCALE, MIN_ZOOM_SCALE } from "./zoomUtils";

describe("zoomUtils", () => {
  it("clamps scale within supported bounds", () => {
    expect(clampZoomScale(0)).toBe(MIN_ZOOM_SCALE);
    expect(clampZoomScale(1)).toBe(1);
    expect(clampZoomScale(20)).toBe(MAX_ZOOM_SCALE);
  });

  it("applies relative zoom with damping near the center", () => {
    const result = applyZoomDelta(1, 1);
    expect(result).toBeGreaterThan(1);
    expect(result).toBeLessThan(1.25);
  });

  it("reduces zoom sensitivity near the maximum bound", () => {
    const centerRatio = applyZoomDelta(1, 0.5) / 1;
    const nearMaxRatio = applyZoomDelta(9.5, 0.5) / 9.5;
    expect(nearMaxRatio).toBeLessThan(centerRatio);
    expect(applyZoomDelta(10, 1)).toBe(MAX_ZOOM_SCALE);
  });

  it("reduces zoom sensitivity near the minimum bound", () => {
    const centerRatio = applyZoomDelta(1, -0.5) / 1;
    const nearMinRatio = applyZoomDelta(0.02, -0.5) / 0.02;
    expect(nearMinRatio).toBeGreaterThan(centerRatio);
    expect(applyZoomDelta(0.01, -1)).toBe(MIN_ZOOM_SCALE);
  });
});

/**
 * Debug notes:
 * - Reviewed src/utils/zoomUtils.ts to ensure test coverage matches exported helpers.
 */
