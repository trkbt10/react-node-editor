/**
 * @file Tests for node appearance calculations
 */
import { describe, it, expect } from "vitest";
import type { Node } from "../../types/core";
import {
  getGroupBackground,
  getGroupOpacity,
  getGroupTextColor,
  getBackgroundWithOpacity,
  computeNodeAppearance,
  areNodeAppearancesEqual,
  type NodeAppearance,
} from "./nodeAppearance";

const createNode = (data: Record<string, unknown> = {}): Node => ({
  id: "node-1",
  type: "test",
  position: { x: 0, y: 0 },
  data: { title: "Test", ...data },
});

describe("getGroupBackground", () => {
  it("returns undefined when not a group", () => {
    const node = createNode({ groupBackground: "#ff0000" });
    expect(getGroupBackground(node, false)).toBeUndefined();
  });

  it("returns undefined when group has no background", () => {
    const node = createNode({});
    expect(getGroupBackground(node, true)).toBeUndefined();
  });

  it("returns background color when group has it", () => {
    const node = createNode({ groupBackground: "#ff0000" });
    expect(getGroupBackground(node, true)).toBe("#ff0000");
  });

  it("returns undefined when groupBackground is not a string", () => {
    const node = createNode({ groupBackground: 123 });
    expect(getGroupBackground(node, true)).toBeUndefined();
  });
});

describe("getGroupOpacity", () => {
  it("returns undefined when not a group", () => {
    const node = createNode({ groupOpacity: 0.5 });
    expect(getGroupOpacity(node, false)).toBeUndefined();
  });

  it("returns undefined when group has no opacity", () => {
    const node = createNode({});
    expect(getGroupOpacity(node, true)).toBeUndefined();
  });

  it("returns opacity when group has it", () => {
    const node = createNode({ groupOpacity: 0.5 });
    expect(getGroupOpacity(node, true)).toBe(0.5);
  });

  it("returns undefined when groupOpacity is not a number", () => {
    const node = createNode({ groupOpacity: "0.5" });
    expect(getGroupOpacity(node, true)).toBeUndefined();
  });
});

describe("getGroupTextColor", () => {
  it("returns undefined when not a group", () => {
    expect(getGroupTextColor("#ff0000", false)).toBeUndefined();
  });

  it("returns text color when group has background", () => {
    const textColor = getGroupTextColor("#000000", true);
    expect(textColor).toBeDefined();
    expect(typeof textColor).toBe("string");
  });

  it("returns undefined when background is undefined", () => {
    expect(getGroupTextColor(undefined, true)).toBeUndefined();
  });
});

describe("getBackgroundWithOpacity", () => {
  it("returns undefined when not a group", () => {
    expect(getBackgroundWithOpacity("#ff0000", 0.5, false)).toBeUndefined();
  });

  it("returns undefined when background is undefined", () => {
    expect(getBackgroundWithOpacity(undefined, 0.5, true)).toBeUndefined();
  });

  it("returns background when opacity is undefined", () => {
    expect(getBackgroundWithOpacity("#ff0000", undefined, true)).toBe("#ff0000");
  });

  it("applies opacity when both are defined", () => {
    const result = getBackgroundWithOpacity("#ff0000", 0.5, true);
    expect(result).toBeDefined();
    expect(result).not.toBe("#ff0000");
  });
});

describe("computeNodeAppearance", () => {
  it("returns all undefined for non-group nodes", () => {
    const node = createNode({ groupBackground: "#ff0000", groupOpacity: 0.5 });
    const appearance = computeNodeAppearance(node, false);

    expect(appearance.groupBackground).toBeUndefined();
    expect(appearance.groupOpacity).toBeUndefined();
    expect(appearance.groupTextColor).toBeUndefined();
    expect(appearance.backgroundWithOpacity).toBeUndefined();
  });

  it("returns all properties for group nodes", () => {
    const node = createNode({ groupBackground: "#ff0000", groupOpacity: 0.5 });
    const appearance = computeNodeAppearance(node, true);

    expect(appearance.groupBackground).toBe("#ff0000");
    expect(appearance.groupOpacity).toBe(0.5);
    expect(appearance.groupTextColor).toBeDefined();
    expect(appearance.backgroundWithOpacity).toBeDefined();
  });
});

describe("areNodeAppearancesEqual", () => {
  const createAppearance = (overrides: Partial<NodeAppearance> = {}): NodeAppearance => ({
    groupBackground: "#ff0000",
    groupOpacity: 0.5,
    groupTextColor: "#ffffff",
    backgroundWithOpacity: "rgba(255, 0, 0, 0.5)",
    ...overrides,
  });

  it("returns true when all properties are equal", () => {
    const prev = createAppearance();
    const next = createAppearance();
    expect(areNodeAppearancesEqual(prev, next)).toBe(true);
  });

  it("returns false when groupBackground differs", () => {
    const prev = createAppearance();
    const next = createAppearance({ groupBackground: "#00ff00" });
    expect(areNodeAppearancesEqual(prev, next)).toBe(false);
  });

  it("returns false when groupOpacity differs", () => {
    const prev = createAppearance();
    const next = createAppearance({ groupOpacity: 0.8 });
    expect(areNodeAppearancesEqual(prev, next)).toBe(false);
  });

  it("returns false when groupTextColor differs", () => {
    const prev = createAppearance();
    const next = createAppearance({ groupTextColor: "#000000" });
    expect(areNodeAppearancesEqual(prev, next)).toBe(false);
  });

  it("returns false when backgroundWithOpacity differs", () => {
    const prev = createAppearance();
    const next = createAppearance({ backgroundWithOpacity: "rgba(0, 255, 0, 0.5)" });
    expect(areNodeAppearancesEqual(prev, next)).toBe(false);
  });

  it("returns true when both have undefined values", () => {
    const prev = createAppearance({
      groupBackground: undefined,
      groupOpacity: undefined,
      groupTextColor: undefined,
      backgroundWithOpacity: undefined,
    });
    const next = createAppearance({
      groupBackground: undefined,
      groupOpacity: undefined,
      groupTextColor: undefined,
      backgroundWithOpacity: undefined,
    });
    expect(areNodeAppearancesEqual(prev, next)).toBe(true);
  });
});
