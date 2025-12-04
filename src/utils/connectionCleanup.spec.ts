/**
 * @file Unit tests for connection cleanup utilities
 */
import type { Connection, Port } from "../types/core";
import {
  cleanupOrphanedConnections,
  cleanupOrphanedConnectionsForNodes,
  findOrphanedConnections,
  createPortIdSet,
  detectRemovedPorts,
} from "./connectionCleanup";

describe("cleanupOrphanedConnections", () => {
  it("should remove connections to non-existent from-ports", () => {
    const connections: Record<string, Connection> = {
      "conn-1": {
        id: "conn-1",
        fromNodeId: "node-1",
        fromPortId: "output-1",
        toNodeId: "node-2",
        toPortId: "input-1",
      },
      "conn-2": {
        id: "conn-2",
        fromNodeId: "node-1",
        fromPortId: "output-2",
        toNodeId: "node-2",
        toPortId: "input-2",
      },
    };

    // Only output-1 is valid now
    const validPorts = new Set(["output-1"]);
    const result = cleanupOrphanedConnections(connections, "node-1", validPorts);

    expect(result.removedConnectionIds).toEqual(["conn-2"]);
    expect(Object.keys(result.updatedConnections)).toEqual(["conn-1"]);
  });

  it("should remove connections to non-existent to-ports", () => {
    const connections: Record<string, Connection> = {
      "conn-1": {
        id: "conn-1",
        fromNodeId: "node-1",
        fromPortId: "output-1",
        toNodeId: "node-2",
        toPortId: "input-1",
      },
      "conn-2": {
        id: "conn-2",
        fromNodeId: "node-1",
        fromPortId: "output-2",
        toNodeId: "node-2",
        toPortId: "input-2",
      },
    };

    // Only input-2 is valid on node-2
    const validPorts = new Set(["input-2"]);
    const result = cleanupOrphanedConnections(connections, "node-2", validPorts);

    expect(result.removedConnectionIds).toEqual(["conn-1"]);
    expect(Object.keys(result.updatedConnections)).toEqual(["conn-2"]);
  });

  it("should preserve connections not involving the target node", () => {
    const connections: Record<string, Connection> = {
      "conn-1": {
        id: "conn-1",
        fromNodeId: "node-1",
        fromPortId: "output-1",
        toNodeId: "node-2",
        toPortId: "input-1",
      },
      "conn-2": {
        id: "conn-2",
        fromNodeId: "node-3",
        fromPortId: "output-x",
        toNodeId: "node-4",
        toPortId: "input-x",
      },
    };

    // Empty valid ports for node-1 should only affect conn-1
    const result = cleanupOrphanedConnections(connections, "node-1", new Set());

    expect(result.removedConnectionIds).toEqual(["conn-1"]);
    expect(Object.keys(result.updatedConnections)).toEqual(["conn-2"]);
  });

  it("should return empty arrays when all connections are valid", () => {
    const connections: Record<string, Connection> = {
      "conn-1": {
        id: "conn-1",
        fromNodeId: "node-1",
        fromPortId: "output-1",
        toNodeId: "node-2",
        toPortId: "input-1",
      },
    };

    const validPorts = new Set(["output-1", "output-2"]);
    const result = cleanupOrphanedConnections(connections, "node-1", validPorts);

    expect(result.removedConnectionIds).toEqual([]);
    expect(Object.keys(result.updatedConnections)).toEqual(["conn-1"]);
  });
});

describe("cleanupOrphanedConnectionsForNodes", () => {
  it("should clean up connections for multiple nodes", () => {
    const connections: Record<string, Connection> = {
      "conn-1": {
        id: "conn-1",
        fromNodeId: "node-1",
        fromPortId: "output-1",
        toNodeId: "node-2",
        toPortId: "input-1",
      },
      "conn-2": {
        id: "conn-2",
        fromNodeId: "node-1",
        fromPortId: "output-2",
        toNodeId: "node-2",
        toPortId: "input-2",
      },
      "conn-3": {
        id: "conn-3",
        fromNodeId: "node-3",
        fromPortId: "output-a",
        toNodeId: "node-4",
        toPortId: "input-a",
      },
    };

    const nodePortMap = new Map([
      ["node-1", new Set(["output-1"])], // output-2 is removed
      ["node-2", new Set(["input-2"])], // input-1 is removed
    ]);

    const result = cleanupOrphanedConnectionsForNodes(connections, nodePortMap);

    // conn-1 invalid: node-2.input-1 removed
    // conn-2 invalid: node-1.output-2 removed
    // conn-3 valid: nodes not in map
    expect(result.removedConnectionIds.sort()).toEqual(["conn-1", "conn-2"]);
    expect(Object.keys(result.updatedConnections)).toEqual(["conn-3"]);
  });

  it("should not check nodes not in the map", () => {
    const connections: Record<string, Connection> = {
      "conn-1": {
        id: "conn-1",
        fromNodeId: "node-1",
        fromPortId: "output-1",
        toNodeId: "node-2",
        toPortId: "input-1",
      },
    };

    // Only check node-1, node-2 is not in map
    const nodePortMap = new Map([["node-1", new Set(["output-1"])]]);

    const result = cleanupOrphanedConnectionsForNodes(connections, nodePortMap);

    expect(result.removedConnectionIds).toEqual([]);
    expect(Object.keys(result.updatedConnections)).toEqual(["conn-1"]);
  });
});

describe("findOrphanedConnections", () => {
  it("should find connections that would be orphaned", () => {
    const connections: Record<string, Connection> = {
      "conn-1": {
        id: "conn-1",
        fromNodeId: "node-1",
        fromPortId: "output-1",
        toNodeId: "node-2",
        toPortId: "input-1",
      },
      "conn-2": {
        id: "conn-2",
        fromNodeId: "node-1",
        fromPortId: "output-2",
        toNodeId: "node-2",
        toPortId: "input-2",
      },
      "conn-3": {
        id: "conn-3",
        fromNodeId: "node-1",
        fromPortId: "output-3",
        toNodeId: "node-2",
        toPortId: "input-3",
      },
    };

    const portsToRemove = new Set(["output-1", "output-3"]);
    const orphaned = findOrphanedConnections(connections, "node-1", portsToRemove);

    expect(orphaned.sort()).toEqual(["conn-1", "conn-3"]);
  });

  it("should return empty array when no ports are removed", () => {
    const connections: Record<string, Connection> = {
      "conn-1": {
        id: "conn-1",
        fromNodeId: "node-1",
        fromPortId: "output-1",
        toNodeId: "node-2",
        toPortId: "input-1",
      },
    };

    const orphaned = findOrphanedConnections(connections, "node-1", new Set());
    expect(orphaned).toEqual([]);
  });
});

describe("createPortIdSet", () => {
  it("should create a set from port IDs", () => {
    const ports: Port[] = [
      { id: "port-1", type: "input", label: "P1", nodeId: "n1", position: "left" },
      { id: "port-2", type: "input", label: "P2", nodeId: "n1", position: "left" },
      { id: "port-3", type: "output", label: "P3", nodeId: "n1", position: "right" },
    ];

    const set = createPortIdSet(ports);

    expect(set.size).toBe(3);
    expect(set.has("port-1")).toBe(true);
    expect(set.has("port-2")).toBe(true);
    expect(set.has("port-3")).toBe(true);
    expect(set.has("port-4")).toBe(false);
  });

  it("should return empty set for empty array", () => {
    const set = createPortIdSet([]);
    expect(set.size).toBe(0);
  });
});

describe("detectRemovedPorts", () => {
  it("should detect ports that were removed", () => {
    const previousPorts: Port[] = [
      { id: "port-1", type: "input", label: "P1", nodeId: "n1", position: "left" },
      { id: "port-2", type: "input", label: "P2", nodeId: "n1", position: "left" },
      { id: "port-3", type: "output", label: "P3", nodeId: "n1", position: "right" },
    ];

    const currentPorts: Port[] = [
      { id: "port-1", type: "input", label: "P1", nodeId: "n1", position: "left" },
    ];

    const removed = detectRemovedPorts(previousPorts, currentPorts);

    expect(removed.size).toBe(2);
    expect(removed.has("port-2")).toBe(true);
    expect(removed.has("port-3")).toBe(true);
  });

  it("should return empty set when no ports removed", () => {
    const ports: Port[] = [
      { id: "port-1", type: "input", label: "P1", nodeId: "n1", position: "left" },
    ];

    const removed = detectRemovedPorts(ports, ports);
    expect(removed.size).toBe(0);
  });

  it("should return empty set when previous was empty", () => {
    const currentPorts: Port[] = [
      { id: "port-1", type: "input", label: "P1", nodeId: "n1", position: "left" },
    ];

    const removed = detectRemovedPorts([], currentPorts);
    expect(removed.size).toBe(0);
  });
});
