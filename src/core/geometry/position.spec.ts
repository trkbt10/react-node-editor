/**
 * @file Unit tests for position utilities
 */
import {
  applyOffset,
  subtractOffset,
  getPreviewPosition,
  getMidpoint,
  getDistance,
  isPointNearLineSegment,
} from "./position";
import type { Position } from "../../types/core";

describe("position utilities", () => {
  describe("applyOffset", () => {
    it("adds offset to position", () => {
      const position: Position = { x: 100, y: 200 };
      const offset: Position = { x: 10, y: -20 };
      expect(applyOffset(position, offset)).toEqual({ x: 110, y: 180 });
    });

    it("handles zero offset", () => {
      const position: Position = { x: 100, y: 200 };
      const offset: Position = { x: 0, y: 0 };
      expect(applyOffset(position, offset)).toEqual({ x: 100, y: 200 });
    });

    it("handles negative positions", () => {
      const position: Position = { x: -50, y: -100 };
      const offset: Position = { x: 25, y: 50 };
      expect(applyOffset(position, offset)).toEqual({ x: -25, y: -50 });
    });
  });

  describe("subtractOffset", () => {
    it("subtracts offset from position", () => {
      const position: Position = { x: 100, y: 200 };
      const offset: Position = { x: 10, y: 20 };
      expect(subtractOffset(position, offset)).toEqual({ x: 90, y: 180 });
    });
  });

  describe("getPreviewPosition", () => {
    it("returns null when offset is null", () => {
      const position: Position = { x: 100, y: 200 };
      expect(getPreviewPosition(position, null)).toBeNull();
    });

    it("calculates preview position with offset", () => {
      const position: Position = { x: 100, y: 200 };
      const offset: Position = { x: 10, y: -20 };
      expect(getPreviewPosition(position, offset)).toEqual({ x: 110, y: 180 });
    });
  });

  describe("getMidpoint", () => {
    it("calculates midpoint between two positions", () => {
      const from: Position = { x: 0, y: 0 };
      const to: Position = { x: 100, y: 100 };
      expect(getMidpoint(from, to)).toEqual({ x: 50, y: 50 });
    });
  });

  describe("getDistance", () => {
    it("calculates distance between two positions", () => {
      const from: Position = { x: 0, y: 0 };
      const to: Position = { x: 3, y: 4 };
      expect(getDistance(from, to)).toBe(5);
    });
  });

  describe("isPointNearLineSegment", () => {
    it("returns true when point is near line segment", () => {
      const point: Position = { x: 50, y: 5 };
      const lineStart: Position = { x: 0, y: 0 };
      const lineEnd: Position = { x: 100, y: 0 };
      expect(isPointNearLineSegment(point, lineStart, lineEnd, 10)).toBe(true);
    });

    it("returns false when point is far from line segment", () => {
      const point: Position = { x: 50, y: 50 };
      const lineStart: Position = { x: 0, y: 0 };
      const lineEnd: Position = { x: 100, y: 0 };
      expect(isPointNearLineSegment(point, lineStart, lineEnd, 10)).toBe(false);
    });
  });
});
