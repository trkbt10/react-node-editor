/**
 * @file Unit tests for error node definition
 */

import {
  createErrorNodeDefinition,
  defaultFallbackFactory,
  ERROR_NODE_TYPE_PREFIX,
  isErrorNodeType,
  getOriginalTypeFromErrorType,
} from "./index";

describe("createErrorNodeDefinition", () => {
  it("should create an error node definition with correct type prefix", () => {
    const def = createErrorNodeDefinition("custom-node");

    expect(def.type).toBe(`${ERROR_NODE_TYPE_PREFIX}custom-node`);
  });

  it("should have visualState set to error", () => {
    const def = createErrorNodeDefinition("test-type");

    expect(def.visualState).toBe("error");
  });

  it("should preserve original type in defaultData", () => {
    const def = createErrorNodeDefinition("my-missing-type");

    expect(def.defaultData?.originalType).toBe("my-missing-type");
  });

  it("should have error message in defaultData", () => {
    const def = createErrorNodeDefinition("unknown-type");

    expect(def.defaultData?.errorMessage).toContain("unknown-type");
  });

  it("should have no ports", () => {
    const def = createErrorNodeDefinition("test");

    expect(def.ports).toEqual([]);
  });

  it("should have node behavior", () => {
    const def = createErrorNodeDefinition("test");

    expect(def.behaviors).toContain("node");
  });

  it("should have internal category", () => {
    const def = createErrorNodeDefinition("test");

    expect(def.category).toBe("__internal__");
  });

  it("should have renderNode function", () => {
    const def = createErrorNodeDefinition("test");

    expect(def.renderNode).toBeDefined();
    expect(typeof def.renderNode).toBe("function");
  });
});

describe("defaultFallbackFactory", () => {
  it("should return a NodeDefinition", () => {
    const def = defaultFallbackFactory("test-type");

    expect(def).toBeDefined();
    expect(def.type).toBe(`${ERROR_NODE_TYPE_PREFIX}test-type`);
  });

  it("should work with different type names", () => {
    const def1 = defaultFallbackFactory("type-a");
    const def2 = defaultFallbackFactory("type-b");

    expect(def1.type).not.toBe(def2.type);
    expect(def1.type).toContain("type-a");
    expect(def2.type).toContain("type-b");
  });
});

describe("isErrorNodeType", () => {
  it("should return true for error node types", () => {
    const errorType = `${ERROR_NODE_TYPE_PREFIX}some-type`;

    expect(isErrorNodeType(errorType)).toBe(true);
  });

  it("should return false for regular node types", () => {
    expect(isErrorNodeType("standard")).toBe(false);
    expect(isErrorNodeType("group")).toBe(false);
    expect(isErrorNodeType("custom-node")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isErrorNodeType("")).toBe(false);
  });
});

describe("getOriginalTypeFromErrorType", () => {
  it("should extract original type from error node type", () => {
    const errorType = `${ERROR_NODE_TYPE_PREFIX}my-original-type`;

    const result = getOriginalTypeFromErrorType(errorType);

    expect(result).toBe("my-original-type");
  });

  it("should return undefined for non-error types", () => {
    expect(getOriginalTypeFromErrorType("standard")).toBeUndefined();
    expect(getOriginalTypeFromErrorType("custom")).toBeUndefined();
  });

  it("should handle empty original type", () => {
    const errorType = `${ERROR_NODE_TYPE_PREFIX}`;

    const result = getOriginalTypeFromErrorType(errorType);

    expect(result).toBe("");
  });
});

describe("ERROR_NODE_TYPE_PREFIX", () => {
  it("should be a non-empty string", () => {
    expect(ERROR_NODE_TYPE_PREFIX).toBeDefined();
    expect(typeof ERROR_NODE_TYPE_PREFIX).toBe("string");
    expect(ERROR_NODE_TYPE_PREFIX.length).toBeGreaterThan(0);
  });

  it("should start with double underscore for internal identification", () => {
    expect(ERROR_NODE_TYPE_PREFIX.startsWith("__")).toBe(true);
  });
});
