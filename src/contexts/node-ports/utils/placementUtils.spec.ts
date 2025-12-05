/**
 * @file Tests for placement utility functions
 */
import {
  isAbsolutePlacement,
  getAbsoluteUnit,
  isPercentPlacement,
  absolutePx,
  absolutePercent,
  getPlacementSide,
  getPlacementAlign,
  getPlacementInset,
  getPlacementSegment,
} from "./placementUtils";
import type { AbsolutePortPlacement, PortPlacement } from "../../../types/core";

describe("isAbsolutePlacement", () => {
  it("returns true for absolute placement", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50 };
    expect(isAbsolutePlacement(placement)).toBe(true);
  });

  it("returns true for absolute placement with unit", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50, unit: "percent" };
    expect(isAbsolutePlacement(placement)).toBe(true);
  });

  it("returns false for side placement", () => {
    const placement: PortPlacement = { side: "left" };
    expect(isAbsolutePlacement(placement)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isAbsolutePlacement(undefined)).toBe(false);
  });
});

describe("getAbsoluteUnit", () => {
  it("returns px when unit is not specified", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50 };
    expect(getAbsoluteUnit(placement)).toBe("px");
  });

  it("returns px when unit is explicitly px", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50, unit: "px" };
    expect(getAbsoluteUnit(placement)).toBe("px");
  });

  it("returns percent when unit is percent", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50, unit: "percent" };
    expect(getAbsoluteUnit(placement)).toBe("percent");
  });
});

describe("isPercentPlacement", () => {
  it("returns true for percent placement", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50, unit: "percent" };
    expect(isPercentPlacement(placement)).toBe(true);
  });

  it("returns false for px placement", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50, unit: "px" };
    expect(isPercentPlacement(placement)).toBe(false);
  });

  it("returns false when unit is not specified (defaults to px)", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50 };
    expect(isPercentPlacement(placement)).toBe(false);
  });
});

describe("absolutePx", () => {
  it("creates absolute placement with px unit", () => {
    const placement = absolutePx(100, 50);
    expect(placement).toEqual({
      mode: "absolute",
      x: 100,
      y: 50,
      unit: "px",
    });
  });

  it("creates placement with correct x and y values", () => {
    const placement = absolutePx(0, 0);
    expect(placement.x).toBe(0);
    expect(placement.y).toBe(0);
    expect(placement.unit).toBe("px");
  });
});

describe("absolutePercent", () => {
  it("creates absolute placement with percent unit", () => {
    const placement = absolutePercent(50, 50);
    expect(placement).toEqual({
      mode: "absolute",
      x: 50,
      y: 50,
      unit: "percent",
    });
  });

  it("creates placement with corner values", () => {
    const topLeft = absolutePercent(0, 0);
    expect(topLeft.x).toBe(0);
    expect(topLeft.y).toBe(0);
    expect(topLeft.unit).toBe("percent");

    const bottomRight = absolutePercent(100, 100);
    expect(bottomRight.x).toBe(100);
    expect(bottomRight.y).toBe(100);
    expect(bottomRight.unit).toBe("percent");
  });
});

describe("getPlacementSide", () => {
  it("returns side from PortPlacement", () => {
    const placement: PortPlacement = { side: "left" };
    expect(getPlacementSide(placement)).toBe("left");
  });

  it("returns fallback for absolute placement", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50 };
    expect(getPlacementSide(placement)).toBe("right");
  });

  it("returns custom fallback for absolute placement", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50 };
    expect(getPlacementSide(placement, "top")).toBe("top");
  });
});

describe("getPlacementAlign", () => {
  it("returns align from PortPlacement", () => {
    const placement: PortPlacement = { side: "left", align: 0.25 };
    expect(getPlacementAlign(placement)).toBe(0.25);
  });

  it("returns undefined for absolute placement", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50 };
    expect(getPlacementAlign(placement)).toBeUndefined();
  });

  it("returns undefined for undefined placement", () => {
    expect(getPlacementAlign(undefined)).toBeUndefined();
  });
});

describe("getPlacementInset", () => {
  it("returns true when inset is true", () => {
    const placement: PortPlacement = { side: "left", inset: true };
    expect(getPlacementInset(placement)).toBe(true);
  });

  it("returns false when inset is not set", () => {
    const placement: PortPlacement = { side: "left" };
    expect(getPlacementInset(placement)).toBe(false);
  });

  it("returns false for absolute placement", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50 };
    expect(getPlacementInset(placement)).toBe(false);
  });

  it("returns false for undefined placement", () => {
    expect(getPlacementInset(undefined)).toBe(false);
  });
});

describe("getPlacementSegment", () => {
  it("returns segment from PortPlacement", () => {
    const placement: PortPlacement = { side: "left", segment: "main" };
    expect(getPlacementSegment(placement)).toBe("main");
  });

  it("returns undefined when segment is not set", () => {
    const placement: PortPlacement = { side: "left" };
    expect(getPlacementSegment(placement)).toBeUndefined();
  });

  it("returns undefined for absolute placement", () => {
    const placement: AbsolutePortPlacement = { mode: "absolute", x: 50, y: 50 };
    expect(getPlacementSegment(placement)).toBeUndefined();
  });

  it("returns undefined for undefined placement", () => {
    expect(getPlacementSegment(undefined)).toBeUndefined();
  });
});
