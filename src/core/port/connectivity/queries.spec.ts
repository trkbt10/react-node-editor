/**
 * @file Unit tests for port query utilities
 */
import { getPortConnections, hasPortConnections, countPortConnections } from "../connectivity/queries";
import type { Port, Connection } from "../../../types/core";

describe("port query utilities", () => {
  const createPort = (id: string, nodeId: string, type: "input" | "output"): Port => ({
    id,
    nodeId,
    type,
    label: id,
    position: type === "input" ? "left" : "right",
  });

  const createConnection = (
    id: string,
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string,
  ): Connection => ({
    id,
    fromNodeId,
    fromPortId,
    toNodeId,
    toPortId,
  });

  describe("getPortConnections", () => {
    it("returns empty array when port has no connections", () => {
      const port = createPort("out", "node1", "output");
      const connections: Record<string, Connection> = {};
      expect(getPortConnections(port, connections)).toEqual([]);
    });

    it("returns connections where port is the source", () => {
      const port = createPort("out", "node1", "output");
      const connections: Record<string, Connection> = {
        c1: createConnection("c1", "node1", "out", "node2", "in"),
        c2: createConnection("c2", "node3", "out", "node4", "in"),
      };
      const result = getPortConnections(port, connections);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("c1");
    });

    it("returns connections where port is the target", () => {
      const port = createPort("in", "node2", "input");
      const connections: Record<string, Connection> = {
        c1: createConnection("c1", "node1", "out", "node2", "in"),
        c2: createConnection("c2", "node3", "out", "node4", "in"),
      };
      const result = getPortConnections(port, connections);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("c1");
    });

    it("returns multiple connections for the same port", () => {
      const port = createPort("out", "node1", "output");
      const connections: Record<string, Connection> = {
        c1: createConnection("c1", "node1", "out", "node2", "in1"),
        c2: createConnection("c2", "node1", "out", "node3", "in2"),
      };
      const result = getPortConnections(port, connections);
      expect(result).toHaveLength(2);
    });
  });

  describe("hasPortConnections", () => {
    it("returns false when port has no connections", () => {
      const port = createPort("out", "node1", "output");
      expect(hasPortConnections(port, {})).toBe(false);
    });

    it("returns true when port has connections", () => {
      const port = createPort("out", "node1", "output");
      const connections: Record<string, Connection> = {
        c1: createConnection("c1", "node1", "out", "node2", "in"),
      };
      expect(hasPortConnections(port, connections)).toBe(true);
    });
  });

  describe("countPortConnections", () => {
    it("returns 0 when port has no connections", () => {
      const port = createPort("out", "node1", "output");
      expect(countPortConnections(port, {})).toBe(0);
    });

    it("returns correct count when port has connections", () => {
      const port = createPort("out", "node1", "output");
      const connections: Record<string, Connection> = {
        c1: createConnection("c1", "node1", "out", "node2", "in1"),
        c2: createConnection("c2", "node1", "out", "node3", "in2"),
      };
      expect(countPortConnections(port, connections)).toBe(2);
    });
  });
});
