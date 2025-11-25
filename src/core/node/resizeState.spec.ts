/**
 * @file Unit tests for node resize state utilities
 */
import { isNodeInResizeState, getNodeResizeSize, getNodeResizePosition } from "./resizeState";
import type { ResizeState } from "../../types/core";

describe("node resizeState utilities", () => {
  describe("isNodeInResizeState", () => {
    it("returns false when resizeState is null", () => {
      expect(isNodeInResizeState(null, "node-1")).toBe(false);
    });

    it("returns true for resizing node", () => {
      const resizeState: ResizeState = {
        nodeId: "node-1",
        handle: "se",
        startSize: { width: 100, height: 100 },
        startPosition: { x: 0, y: 0 },
        startNodePosition: { x: 0, y: 0 },
        currentSize: { width: 100, height: 100 },
        currentPosition: { x: 0, y: 0 },
      };
      expect(isNodeInResizeState(resizeState, "node-1")).toBe(true);
    });

    it("returns false for different node", () => {
      const resizeState: ResizeState = {
        nodeId: "node-1",
        handle: "se",
        startSize: { width: 100, height: 100 },
        startPosition: { x: 0, y: 0 },
        startNodePosition: { x: 0, y: 0 },
        currentSize: { width: 100, height: 100 },
        currentPosition: { x: 0, y: 0 },
      };
      expect(isNodeInResizeState(resizeState, "other-node")).toBe(false);
    });
  });

  describe("getNodeResizeSize", () => {
    it("returns null when resizeState is null", () => {
      expect(getNodeResizeSize(null, "node-1")).toBeNull();
    });

    it("returns size for resizing node", () => {
      const resizeState: ResizeState = {
        nodeId: "node-1",
        handle: "se",
        startSize: { width: 100, height: 100 },
        startPosition: { x: 0, y: 0 },
        startNodePosition: { x: 0, y: 0 },
        currentSize: { width: 150, height: 120 },
        currentPosition: { x: 0, y: 0 },
      };
      expect(getNodeResizeSize(resizeState, "node-1")).toEqual({ width: 150, height: 120 });
    });

    it("returns null for different node", () => {
      const resizeState: ResizeState = {
        nodeId: "node-1",
        handle: "se",
        startSize: { width: 100, height: 100 },
        startPosition: { x: 0, y: 0 },
        startNodePosition: { x: 0, y: 0 },
        currentSize: { width: 150, height: 120 },
        currentPosition: { x: 0, y: 0 },
      };
      expect(getNodeResizeSize(resizeState, "other-node")).toBeNull();
    });
  });

  describe("getNodeResizePosition", () => {
    it("returns null when resizeState is null", () => {
      expect(getNodeResizePosition(null, "node-1")).toBeNull();
    });

    it("returns position for resizing node", () => {
      const resizeState: ResizeState = {
        nodeId: "node-1",
        handle: "nw",
        startSize: { width: 100, height: 100 },
        startPosition: { x: 0, y: 0 },
        startNodePosition: { x: 50, y: 50 },
        currentSize: { width: 120, height: 110 },
        currentPosition: { x: 30, y: 40 },
      };
      expect(getNodeResizePosition(resizeState, "node-1")).toEqual({ x: 30, y: 40 });
    });

    it("returns null for different node", () => {
      const resizeState: ResizeState = {
        nodeId: "node-1",
        handle: "nw",
        startSize: { width: 100, height: 100 },
        startPosition: { x: 0, y: 0 },
        startNodePosition: { x: 50, y: 50 },
        currentSize: { width: 120, height: 110 },
        currentPosition: { x: 30, y: 40 },
      };
      expect(getNodeResizePosition(resizeState, "other-node")).toBeNull();
    });
  });
});
