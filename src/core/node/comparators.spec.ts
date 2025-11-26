/**
 * @file Tests for node comparison utilities
 */
import type { Node } from "../../types/core";
import { hasNodeGeometryChanged, hasNodeIdentityChanged, hasNodeStateChanged, getNodeDisplaySize, DEFAULT_NODE_SIZE } from "./comparators";

describe("node comparators", () => {
  const createNode = (overrides: Partial<Node> = {}): Node => ({
    id: "node-1",
    type: "default",
    position: { x: 0, y: 0 },
    data: {},
    ...overrides,
  });

  describe("hasNodeGeometryChanged", () => {
    it("returns false when geometry is unchanged", () => {
      const prev = createNode({ position: { x: 10, y: 20 }, size: { width: 100, height: 50 } });
      const next = createNode({ position: { x: 10, y: 20 }, size: { width: 100, height: 50 } });
      expect(hasNodeGeometryChanged(prev, next)).toBe(false);
    });

    it("returns true when position changes", () => {
      const prev = createNode({ position: { x: 10, y: 20 } });
      const next = createNode({ position: { x: 15, y: 20 } });
      expect(hasNodeGeometryChanged(prev, next)).toBe(true);
    });

    it("returns true when size changes", () => {
      const prev = createNode({ size: { width: 100, height: 50 } });
      const next = createNode({ size: { width: 150, height: 50 } });
      expect(hasNodeGeometryChanged(prev, next)).toBe(true);
    });
  });

  describe("hasNodeIdentityChanged", () => {
    it("returns false when identity is unchanged", () => {
      const prev = createNode({ id: "node-1", type: "default" });
      const next = createNode({ id: "node-1", type: "default" });
      expect(hasNodeIdentityChanged(prev, next)).toBe(false);
    });

    it("returns true when id changes", () => {
      const prev = createNode({ id: "node-1" });
      const next = createNode({ id: "node-2" });
      expect(hasNodeIdentityChanged(prev, next)).toBe(true);
    });

    it("returns true when type changes", () => {
      const prev = createNode({ type: "default" });
      const next = createNode({ type: "custom" });
      expect(hasNodeIdentityChanged(prev, next)).toBe(true);
    });
  });

  describe("hasNodeStateChanged", () => {
    it("returns false when state is unchanged", () => {
      const prev = createNode({ locked: false });
      const next = createNode({ locked: false });
      expect(hasNodeStateChanged(prev, next)).toBe(false);
    });

    it("returns true when locked changes", () => {
      const prev = createNode({ locked: false });
      const next = createNode({ locked: true });
      expect(hasNodeStateChanged(prev, next)).toBe(true);
    });
  });

  describe("getNodeDisplaySize", () => {
    it("returns node size when not resizing", () => {
      const node = createNode({ size: { width: 200, height: 100 } });
      expect(getNodeDisplaySize(node, null, false)).toEqual({ width: 200, height: 100 });
    });

    it("returns resize size when resizing", () => {
      const node = createNode({ size: { width: 200, height: 100 } });
      const resizeSize = { width: 250, height: 120 };
      expect(getNodeDisplaySize(node, resizeSize, true)).toEqual(resizeSize);
    });

    it("returns default size when node has no size", () => {
      const node = createNode({ size: undefined });
      expect(getNodeDisplaySize(node, null, false)).toEqual(DEFAULT_NODE_SIZE);
    });

    it("returns node size even when resize size exists but not resizing", () => {
      const node = createNode({ size: { width: 200, height: 100 } });
      const resizeSize = { width: 250, height: 120 };
      expect(getNodeDisplaySize(node, resizeSize, false)).toEqual({ width: 200, height: 100 });
    });
  });
});
