/**
 * @file Tests for common comparison utilities
 */
import { areStringArraysEqual, isPlainValueEqual, areRecordValuesShallowEqual } from "./comparators";

describe("common comparators", () => {
  describe("areStringArraysEqual", () => {
    it("returns true when both are undefined", () => {
      expect(areStringArraysEqual(undefined, undefined)).toBe(true);
    });

    it("returns true when both are same reference", () => {
      const arr = ["a", "b"];
      expect(areStringArraysEqual(arr, arr)).toBe(true);
    });

    it("returns false when one is undefined", () => {
      expect(areStringArraysEqual(["a"], undefined)).toBe(false);
      expect(areStringArraysEqual(undefined, ["a"])).toBe(false);
    });

    it("returns false when lengths differ", () => {
      expect(areStringArraysEqual(["a"], ["a", "b"])).toBe(false);
    });

    it("returns true when arrays have same elements in same order", () => {
      expect(areStringArraysEqual(["a", "b", "c"], ["a", "b", "c"])).toBe(true);
    });

    it("returns false when arrays have same elements in different order", () => {
      expect(areStringArraysEqual(["a", "b"], ["b", "a"])).toBe(false);
    });
  });

  describe("isPlainValueEqual", () => {
    it("returns true for same primitives", () => {
      expect(isPlainValueEqual(1, 1)).toBe(true);
      expect(isPlainValueEqual("a", "a")).toBe(true);
      expect(isPlainValueEqual(true, true)).toBe(true);
    });

    it("returns true for same reference", () => {
      const obj = { a: 1 };
      expect(isPlainValueEqual(obj, obj)).toBe(true);
    });

    it("returns false for different types", () => {
      expect(isPlainValueEqual(1, "1")).toBe(false);
    });

    it("returns true for same null values", () => {
      expect(isPlainValueEqual(null, null)).toBe(true);
    });

    it("returns false for null with other values", () => {
      expect(isPlainValueEqual(null, 1)).toBe(false);
      expect(isPlainValueEqual(1, null)).toBe(false);
      expect(isPlainValueEqual(null, undefined)).toBe(false);
    });

    it("returns false for objects (different references)", () => {
      expect(isPlainValueEqual({ a: 1 }, { a: 1 })).toBe(false);
    });

    it("returns false for functions", () => {
      const fn = () => {};
      expect(isPlainValueEqual(fn, fn)).toBe(true);
      expect(isPlainValueEqual(() => {}, () => {})).toBe(false);
    });
  });

  describe("areRecordValuesShallowEqual", () => {
    it("returns true for same reference", () => {
      const obj = { a: 1 };
      expect(areRecordValuesShallowEqual(obj, obj)).toBe(true);
    });

    it("returns true for equal plain values", () => {
      expect(areRecordValuesShallowEqual({ a: 1, b: "x" }, { a: 1, b: "x" })).toBe(true);
    });

    it("returns false when key counts differ", () => {
      expect(areRecordValuesShallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it("returns false when keys differ", () => {
      expect(areRecordValuesShallowEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it("returns false when values differ", () => {
      expect(areRecordValuesShallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it("returns false for nested objects with different references", () => {
      expect(areRecordValuesShallowEqual({ a: { x: 1 } }, { a: { x: 1 } })).toBe(false);
    });
  });
});
