/**
 * @file Tests for port comparison utilities
 */
import type { Port } from "../../../types/core";
import { hasPortIdChanged, hasPortPositionChanged } from "../identity/comparators";

describe("port comparators", () => {
  const createPort = (overrides: Partial<Port> = {}): Port => ({
    id: "port-1",
    nodeId: "node-1",
    type: "input",
    label: "Input",
    position: "left",
    ...overrides,
  });

  describe("hasPortIdChanged", () => {
    it("returns false when both are undefined", () => {
      expect(hasPortIdChanged(undefined, undefined)).toBe(false);
    });

    it("returns false when both are null", () => {
      expect(hasPortIdChanged(null, null)).toBe(false);
    });

    it("returns true when prev is undefined and next is defined", () => {
      expect(hasPortIdChanged(undefined, createPort())).toBe(true);
    });

    it("returns false when ids are equal", () => {
      expect(hasPortIdChanged(createPort({ id: "p1" }), createPort({ id: "p1" }))).toBe(false);
    });

    it("returns true when ids are different", () => {
      expect(hasPortIdChanged(createPort({ id: "p1" }), createPort({ id: "p2" }))).toBe(true);
    });
  });

  describe("hasPortPositionChanged", () => {
    it("returns false when both are undefined", () => {
      expect(hasPortPositionChanged(undefined, undefined)).toBe(false);
    });

    it("returns false when positions are equal", () => {
      expect(hasPortPositionChanged(createPort({ position: "left" }), createPort({ position: "left" }))).toBe(false);
    });

    it("returns true when positions are different", () => {
      expect(hasPortPositionChanged(createPort({ position: "left" }), createPort({ position: "right" }))).toBe(true);
    });
  });
});
