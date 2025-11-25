/**
 * @file Unit tests for node drag state utilities
 */
import {
  isNodeInDragState,
  isNodeDirectlyDragged,
  isNodeChildDragged,
  getNodeDragOffset,
} from "./dragState";
import type { DragState } from "../../types/core";

describe("node dragState utilities", () => {
  describe("isNodeInDragState", () => {
    it("returns false when dragState is null", () => {
      expect(isNodeInDragState(null, "node-1")).toBe(false);
    });

    it("returns true when node is directly dragged", () => {
      const dragState: DragState = {
        nodeIds: ["node-1", "node-2"],
        startPosition: { x: 0, y: 0 },
        offset: { x: 10, y: 20 },
        initialPositions: {},
        affectedChildNodes: {},
      };
      expect(isNodeInDragState(dragState, "node-1")).toBe(true);
      expect(isNodeInDragState(dragState, "node-2")).toBe(true);
    });

    it("returns true when node is a child of a dragged group", () => {
      const dragState: DragState = {
        nodeIds: ["group-1"],
        startPosition: { x: 0, y: 0 },
        offset: { x: 10, y: 20 },
        initialPositions: {},
        affectedChildNodes: {
          "group-1": ["child-1", "child-2"],
        },
      };
      expect(isNodeInDragState(dragState, "child-1")).toBe(true);
      expect(isNodeInDragState(dragState, "child-2")).toBe(true);
    });

    it("returns false when node is not being dragged", () => {
      const dragState: DragState = {
        nodeIds: ["node-1"],
        startPosition: { x: 0, y: 0 },
        offset: { x: 10, y: 20 },
        initialPositions: {},
        affectedChildNodes: {},
      };
      expect(isNodeInDragState(dragState, "other-node")).toBe(false);
    });
  });

  describe("isNodeDirectlyDragged", () => {
    it("returns false when dragState is null", () => {
      expect(isNodeDirectlyDragged(null, "node-1")).toBe(false);
    });

    it("returns true only for directly dragged nodes", () => {
      const dragState: DragState = {
        nodeIds: ["node-1"],
        startPosition: { x: 0, y: 0 },
        offset: { x: 10, y: 20 },
        initialPositions: {},
        affectedChildNodes: {
          "node-1": ["child-1"],
        },
      };
      expect(isNodeDirectlyDragged(dragState, "node-1")).toBe(true);
      expect(isNodeDirectlyDragged(dragState, "child-1")).toBe(false);
    });
  });

  describe("isNodeChildDragged", () => {
    it("returns false when dragState is null", () => {
      expect(isNodeChildDragged(null, "node-1")).toBe(false);
    });

    it("returns false for directly dragged nodes", () => {
      const dragState: DragState = {
        nodeIds: ["node-1"],
        startPosition: { x: 0, y: 0 },
        offset: { x: 10, y: 20 },
        initialPositions: {},
        affectedChildNodes: {},
      };
      expect(isNodeChildDragged(dragState, "node-1")).toBe(false);
    });

    it("returns true only for child nodes", () => {
      const dragState: DragState = {
        nodeIds: ["group-1"],
        startPosition: { x: 0, y: 0 },
        offset: { x: 10, y: 20 },
        initialPositions: {},
        affectedChildNodes: {
          "group-1": ["child-1", "child-2"],
        },
      };
      expect(isNodeChildDragged(dragState, "group-1")).toBe(false);
      expect(isNodeChildDragged(dragState, "child-1")).toBe(true);
      expect(isNodeChildDragged(dragState, "child-2")).toBe(true);
    });
  });

  describe("getNodeDragOffset", () => {
    it("returns null when dragState is null", () => {
      expect(getNodeDragOffset(null, "node-1")).toBeNull();
    });

    it("returns offset for directly dragged node", () => {
      const dragState: DragState = {
        nodeIds: ["node-1"],
        startPosition: { x: 0, y: 0 },
        offset: { x: 10, y: 20 },
        initialPositions: {},
        affectedChildNodes: {},
      };
      expect(getNodeDragOffset(dragState, "node-1")).toEqual({ x: 10, y: 20 });
    });

    it("returns offset for child node", () => {
      const dragState: DragState = {
        nodeIds: ["group-1"],
        startPosition: { x: 0, y: 0 },
        offset: { x: 15, y: 25 },
        initialPositions: {},
        affectedChildNodes: {
          "group-1": ["child-1"],
        },
      };
      expect(getNodeDragOffset(dragState, "child-1")).toEqual({ x: 15, y: 25 });
    });

    it("returns null for non-dragged node", () => {
      const dragState: DragState = {
        nodeIds: ["node-1"],
        startPosition: { x: 0, y: 0 },
        offset: { x: 10, y: 20 },
        initialPositions: {},
        affectedChildNodes: {},
      };
      expect(getNodeDragOffset(dragState, "other-node")).toBeNull();
    });
  });
});
