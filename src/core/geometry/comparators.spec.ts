/**
 * @file Tests for geometry comparison utilities
 */
import {
  hasPositionChanged,
  arePositionsEqual,
  hasSizeChanged,
  areSizesEqual,
  hasAnyPositionChanged,
  hasAnySizeChanged,
} from "./comparators";

describe("geometry comparators", () => {
  describe("hasPositionChanged", () => {
    it("returns false when both are undefined", () => {
      expect(hasPositionChanged(undefined, undefined)).toBe(false);
    });

    it("returns false when both are null", () => {
      expect(hasPositionChanged(null, null)).toBe(false);
    });

    it("returns true when prev is undefined and next is defined", () => {
      expect(hasPositionChanged(undefined, { x: 0, y: 0 })).toBe(true);
    });

    it("returns true when prev is defined and next is undefined", () => {
      expect(hasPositionChanged({ x: 0, y: 0 }, undefined)).toBe(true);
    });

    it("returns false when positions are equal", () => {
      expect(hasPositionChanged({ x: 10, y: 20 }, { x: 10, y: 20 })).toBe(false);
    });

    it("returns true when x is different", () => {
      expect(hasPositionChanged({ x: 10, y: 20 }, { x: 15, y: 20 })).toBe(true);
    });

    it("returns true when y is different", () => {
      expect(hasPositionChanged({ x: 10, y: 20 }, { x: 10, y: 25 })).toBe(true);
    });
  });

  describe("arePositionsEqual", () => {
    it("returns true when both are undefined", () => {
      expect(arePositionsEqual(undefined, undefined)).toBe(true);
    });

    it("returns false when prev is undefined and next is defined", () => {
      expect(arePositionsEqual(undefined, { x: 0, y: 0 })).toBe(false);
    });

    it("returns true when positions are equal", () => {
      expect(arePositionsEqual({ x: 10, y: 20 }, { x: 10, y: 20 })).toBe(true);
    });

    it("returns false when positions are different", () => {
      expect(arePositionsEqual({ x: 10, y: 20 }, { x: 15, y: 20 })).toBe(false);
    });
  });

  describe("hasSizeChanged", () => {
    it("returns false when both are undefined", () => {
      expect(hasSizeChanged(undefined, undefined)).toBe(false);
    });

    it("returns true when prev is undefined and next is defined", () => {
      expect(hasSizeChanged(undefined, { width: 100, height: 50 })).toBe(true);
    });

    it("returns false when sizes are equal", () => {
      expect(hasSizeChanged({ width: 100, height: 50 }, { width: 100, height: 50 })).toBe(false);
    });

    it("returns true when width is different", () => {
      expect(hasSizeChanged({ width: 100, height: 50 }, { width: 150, height: 50 })).toBe(true);
    });

    it("returns true when height is different", () => {
      expect(hasSizeChanged({ width: 100, height: 50 }, { width: 100, height: 75 })).toBe(true);
    });
  });

  describe("areSizesEqual", () => {
    it("returns true when both are undefined", () => {
      expect(areSizesEqual(undefined, undefined)).toBe(true);
    });

    it("returns false when prev is undefined and next is defined", () => {
      expect(areSizesEqual(undefined, { width: 100, height: 50 })).toBe(false);
    });

    it("returns true when sizes are equal", () => {
      expect(areSizesEqual({ width: 100, height: 50 }, { width: 100, height: 50 })).toBe(true);
    });

    it("returns false when sizes are different", () => {
      expect(areSizesEqual({ width: 100, height: 50 }, { width: 150, height: 50 })).toBe(false);
    });
  });

  describe("hasAnyPositionChanged", () => {
    it("returns false when no positions have changed", () => {
      const pairs: Array<[{ x: number; y: number } | undefined, { x: number; y: number } | undefined]> = [
        [{ x: 0, y: 0 }, { x: 0, y: 0 }],
        [{ x: 10, y: 20 }, { x: 10, y: 20 }],
      ];
      expect(hasAnyPositionChanged(pairs)).toBe(false);
    });

    it("returns true when any position has changed", () => {
      const pairs: Array<[{ x: number; y: number } | undefined, { x: number; y: number } | undefined]> = [
        [{ x: 0, y: 0 }, { x: 0, y: 0 }],
        [{ x: 10, y: 20 }, { x: 10, y: 25 }],
      ];
      expect(hasAnyPositionChanged(pairs)).toBe(true);
    });
  });

  describe("hasAnySizeChanged", () => {
    it("returns false when no sizes have changed", () => {
      const pairs: Array<[{ width: number; height: number } | undefined, { width: number; height: number } | undefined]> = [
        [{ width: 100, height: 50 }, { width: 100, height: 50 }],
        [{ width: 200, height: 100 }, { width: 200, height: 100 }],
      ];
      expect(hasAnySizeChanged(pairs)).toBe(false);
    });

    it("returns true when any size has changed", () => {
      const pairs: Array<[{ width: number; height: number } | undefined, { width: number; height: number } | undefined]> = [
        [{ width: 100, height: 50 }, { width: 100, height: 50 }],
        [{ width: 200, height: 100 }, { width: 250, height: 100 }],
      ];
      expect(hasAnySizeChanged(pairs)).toBe(true);
    });
  });
});
