/**
 * @file Unit tests for size utilities
 */
import { clampSize, scaleSize, addSize, subtractSize } from "./size";
import type { Size } from "../../types/core";

describe("size utilities", () => {
  describe("clampSize", () => {
    it("returns original size when no bounds specified", () => {
      const size: Size = { width: 100, height: 100 };
      expect(clampSize(size)).toEqual({ width: 100, height: 100 });
    });

    it("clamps to minSize", () => {
      const size: Size = { width: 50, height: 30 };
      const minSize: Size = { width: 100, height: 50 };
      expect(clampSize(size, minSize)).toEqual({ width: 100, height: 50 });
    });

    it("clamps to maxSize", () => {
      const size: Size = { width: 200, height: 150 };
      const maxSize: Size = { width: 150, height: 100 };
      expect(clampSize(size, undefined, maxSize)).toEqual({ width: 150, height: 100 });
    });

    it("clamps to both min and max", () => {
      const size: Size = { width: 50, height: 200 };
      const minSize: Size = { width: 100, height: 50 };
      const maxSize: Size = { width: 150, height: 100 };
      expect(clampSize(size, minSize, maxSize)).toEqual({ width: 100, height: 100 });
    });
  });

  describe("scaleSize", () => {
    it("scales size by factor", () => {
      const size: Size = { width: 100, height: 50 };
      expect(scaleSize(size, 2)).toEqual({ width: 200, height: 100 });
    });

    it("handles fractional factors", () => {
      const size: Size = { width: 100, height: 100 };
      expect(scaleSize(size, 0.5)).toEqual({ width: 50, height: 50 });
    });
  });

  describe("addSize", () => {
    it("adds two sizes", () => {
      const a: Size = { width: 100, height: 50 };
      const b: Size = { width: 20, height: 30 };
      expect(addSize(a, b)).toEqual({ width: 120, height: 80 });
    });
  });

  describe("subtractSize", () => {
    it("subtracts size b from size a", () => {
      const a: Size = { width: 100, height: 50 };
      const b: Size = { width: 20, height: 30 };
      expect(subtractSize(a, b)).toEqual({ width: 80, height: 20 });
    });
  });
});
