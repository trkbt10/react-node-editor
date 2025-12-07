/**
 * @file Tests for port data type utilities
 */
import {
  normalizePortDataTypes,
  mergePortDataTypes,
  arePortDataTypesCompatible,
  arePortDataTypesEqual,
  primaryPortDataType,
  toPortDataTypeValue,
} from "./dataType";

describe("normalizePortDataTypes", () => {
  it("returns empty array for undefined", () => {
    expect(normalizePortDataTypes(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(normalizePortDataTypes("")).toEqual([]);
  });

  it("returns single-element array for string", () => {
    expect(normalizePortDataTypes("text")).toEqual(["text"]);
  });

  it("returns array as-is for valid array", () => {
    expect(normalizePortDataTypes(["text", "html"])).toEqual(["text", "html"]);
  });

  it("filters out empty strings from array", () => {
    expect(normalizePortDataTypes(["text", "", "html"])).toEqual(["text", "html"]);
  });
});

describe("mergePortDataTypes", () => {
  it("merges two arrays without duplicates", () => {
    expect(mergePortDataTypes(["text"], ["html"])).toEqual(["text", "html"]);
  });

  it("removes duplicates when merging", () => {
    expect(mergePortDataTypes(["text", "html"], ["html", "markdown"])).toEqual([
      "text",
      "html",
      "markdown",
    ]);
  });

  it("handles undefined primary", () => {
    expect(mergePortDataTypes(undefined, ["html"])).toEqual(["html"]);
  });

  it("handles undefined secondary", () => {
    expect(mergePortDataTypes(["text"], undefined)).toEqual(["text"]);
  });
});

describe("arePortDataTypesCompatible", () => {
  describe("basic compatibility", () => {
    it("returns true for matching types", () => {
      expect(arePortDataTypesCompatible("text", "text")).toBe(true);
    });

    it("returns false for non-matching types", () => {
      expect(arePortDataTypesCompatible("text", "image")).toBe(false);
    });

    it("returns true for overlapping arrays", () => {
      expect(arePortDataTypesCompatible(["text", "html"], ["html", "markdown"])).toBe(true);
    });

    it("returns false for non-overlapping arrays", () => {
      expect(arePortDataTypesCompatible(["text", "html"], ["image", "binary"])).toBe(false);
    });
  });

  describe("unspecified types (empty)", () => {
    it("returns true when first type is undefined", () => {
      expect(arePortDataTypesCompatible(undefined, "text")).toBe(true);
    });

    it("returns true when second type is undefined", () => {
      expect(arePortDataTypesCompatible("text", undefined)).toBe(true);
    });

    it("returns true when both types are undefined", () => {
      expect(arePortDataTypesCompatible(undefined, undefined)).toBe(true);
    });

    it("returns true when first type is empty array", () => {
      expect(arePortDataTypesCompatible([], "text")).toBe(true);
    });

    it("returns true when second type is empty array", () => {
      expect(arePortDataTypesCompatible("text", [])).toBe(true);
    });
  });

  describe("literal type 'any' is not special", () => {
    // "any" is treated as a literal type name, not a wildcard
    // To accept any type, leave dataType undefined or use canConnect predicate
    it("returns false when types are 'any' and 'text' (no overlap)", () => {
      expect(arePortDataTypesCompatible("any", "text")).toBe(false);
    });

    it("returns false when types are 'text' and 'any' (no overlap)", () => {
      expect(arePortDataTypesCompatible("text", "any")).toBe(false);
    });

    it("returns true when both types are 'any' (same type)", () => {
      expect(arePortDataTypesCompatible("any", "any")).toBe(true);
    });

    it("returns true when 'any' overlaps with array containing 'any'", () => {
      expect(arePortDataTypesCompatible(["any", "text"], "any")).toBe(true);
    });
  });
});

describe("arePortDataTypesEqual", () => {
  it("returns true for identical types", () => {
    expect(arePortDataTypesEqual("text", "text")).toBe(true);
  });

  it("returns false for different types", () => {
    expect(arePortDataTypesEqual("text", "html")).toBe(false);
  });

  it("returns true for identical arrays regardless of order", () => {
    expect(arePortDataTypesEqual(["text", "html"], ["html", "text"])).toBe(true);
  });

  it("returns false for arrays with different elements", () => {
    expect(arePortDataTypesEqual(["text", "html"], ["text", "markdown"])).toBe(false);
  });

  it("returns true for both undefined", () => {
    expect(arePortDataTypesEqual(undefined, undefined)).toBe(true);
  });

  it("returns false when one is undefined", () => {
    expect(arePortDataTypesEqual("text", undefined)).toBe(false);
    expect(arePortDataTypesEqual(undefined, "text")).toBe(false);
  });
});

describe("primaryPortDataType", () => {
  it("returns first type from string", () => {
    expect(primaryPortDataType("text")).toBe("text");
  });

  it("returns first type from array", () => {
    expect(primaryPortDataType(["text", "html"])).toBe("text");
  });

  it("returns undefined for undefined input", () => {
    expect(primaryPortDataType(undefined)).toBeUndefined();
  });

  it("returns undefined for empty array", () => {
    expect(primaryPortDataType([])).toBeUndefined();
  });
});

describe("toPortDataTypeValue", () => {
  it("returns undefined for empty array", () => {
    expect(toPortDataTypeValue([])).toBeUndefined();
  });

  it("returns string for single-element array", () => {
    expect(toPortDataTypeValue(["text"])).toBe("text");
  });

  it("returns array for multi-element array", () => {
    expect(toPortDataTypeValue(["text", "html"])).toEqual(["text", "html"]);
  });
});
