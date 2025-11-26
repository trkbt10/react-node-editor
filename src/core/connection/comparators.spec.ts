/**
 * @file Tests for connection comparison utilities
 */
import { areConnectionsStructurallyEqual } from "./comparators";
import type { Connection } from "../../types/core";

const createConnection = (overrides: Partial<Connection> = {}): Connection => ({
  id: "conn-1",
  fromNodeId: "node-1",
  fromPortId: "port-out",
  toNodeId: "node-2",
  toPortId: "port-in",
  ...overrides,
});

describe("connection comparators", () => {
  describe("areConnectionsStructurallyEqual", () => {
    it("returns true for same reference", () => {
      const conn = createConnection();
      expect(areConnectionsStructurallyEqual(conn, conn)).toBe(true);
    });

    it("returns true for equal connections", () => {
      const conn1 = createConnection();
      const conn2 = createConnection();
      expect(areConnectionsStructurallyEqual(conn1, conn2)).toBe(true);
    });

    it("returns false when id differs", () => {
      const conn1 = createConnection({ id: "conn-1" });
      const conn2 = createConnection({ id: "conn-2" });
      expect(areConnectionsStructurallyEqual(conn1, conn2)).toBe(false);
    });

    it("returns false when fromNodeId differs", () => {
      const conn1 = createConnection({ fromNodeId: "node-1" });
      const conn2 = createConnection({ fromNodeId: "node-3" });
      expect(areConnectionsStructurallyEqual(conn1, conn2)).toBe(false);
    });

    it("returns false when fromPortId differs", () => {
      const conn1 = createConnection({ fromPortId: "port-out" });
      const conn2 = createConnection({ fromPortId: "port-out-2" });
      expect(areConnectionsStructurallyEqual(conn1, conn2)).toBe(false);
    });

    it("returns false when toNodeId differs", () => {
      const conn1 = createConnection({ toNodeId: "node-2" });
      const conn2 = createConnection({ toNodeId: "node-4" });
      expect(areConnectionsStructurallyEqual(conn1, conn2)).toBe(false);
    });

    it("returns false when toPortId differs", () => {
      const conn1 = createConnection({ toPortId: "port-in" });
      const conn2 = createConnection({ toPortId: "port-in-2" });
      expect(areConnectionsStructurallyEqual(conn1, conn2)).toBe(false);
    });

    it("returns true when both have no data", () => {
      const conn1 = createConnection({ data: undefined });
      const conn2 = createConnection({ data: undefined });
      expect(areConnectionsStructurallyEqual(conn1, conn2)).toBe(true);
    });

    it("returns true when data values are equal", () => {
      const conn1 = createConnection({ data: { label: "test", weight: 1 } });
      const conn2 = createConnection({ data: { label: "test", weight: 1 } });
      expect(areConnectionsStructurallyEqual(conn1, conn2)).toBe(true);
    });

    it("returns false when data values differ", () => {
      const conn1 = createConnection({ data: { label: "test1" } });
      const conn2 = createConnection({ data: { label: "test2" } });
      expect(areConnectionsStructurallyEqual(conn1, conn2)).toBe(false);
    });

    it("returns false when data keys differ", () => {
      const conn1 = createConnection({ data: { a: 1 } });
      const conn2 = createConnection({ data: { b: 1 } });
      expect(areConnectionsStructurallyEqual(conn1, conn2)).toBe(false);
    });
  });
});
