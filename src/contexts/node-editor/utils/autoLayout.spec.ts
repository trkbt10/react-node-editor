/**
 * @file Tests for auto-layout algorithms
 */
import { calculateAutoLayout, calculateHierarchicalLayout, calculateGridLayout } from "./autoLayout";
import type { NodeEditorData } from "../../../types/core";

describe("autoLayout", () => {
  describe("calculateAutoLayout", () => {
    it("should handle single node at origin", () => {
      const data: NodeEditorData = {
        nodes: {
          node1: {
            id: "node1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 1" },
          },
        },
        connections: {},
      };

      const result = calculateAutoLayout(data);
      expect(result.nodePositions["node1"]).toEqual({ x: 0, y: 0 });
    });

    it("should calculate bounding box correctly including node sizes", () => {
      const data: NodeEditorData = {
        nodes: {
          node1: {
            id: "node1",
            type: "default",
            position: { x: 0, y: 0 },
            size: { width: 200, height: 100 },
            data: { title: "Node 1" },
          },
          node2: {
            id: "node2",
            type: "default",
            position: { x: 300, y: 300 },
            size: { width: 200, height: 100 },
            data: { title: "Node 2" },
          },
        },
        connections: {},
      };

      const padding = 100;
      const result = calculateAutoLayout(data, { iterations: 0, padding }); // Skip simulation for bounding box test

      // Calculate expected bounds including node sizes
      // node1: x: 0, y: 0, right: 200, bottom: 100
      // node2: x: 300, y: 300, right: 500, bottom: 400
      // minX: 0, maxX: 500, minY: 0, maxY: 400
      // centerX: 250, centerY: 200

      // After centering with padding:
      // node1: x: 0 - 250 + 100 = -150, y: 0 - 200 + 100 = -100
      // node2: x: 300 - 250 + 100 = 150, y: 300 - 200 + 100 = 200

      expect(result.nodePositions["node1"].x).toBeCloseTo(-150, 0);
      expect(result.nodePositions["node1"].y).toBeCloseTo(-100, 0);
      expect(result.nodePositions["node2"].x).toBeCloseTo(150, 0);
      expect(result.nodePositions["node2"].y).toBeCloseTo(200, 0);

      // Check that nodes are centered around the calculated center
      const allPositions = Object.values(result.nodePositions);
      const avgX = allPositions.reduce((sum, p) => sum + p.x, 0) / allPositions.length;
      const avgY = allPositions.reduce((sum, p) => sum + p.y, 0) / allPositions.length;

      // Average position should not be at origin since we only have 2 nodes
      // But the bounding box including sizes should be centered
      expect(avgX).toBeCloseTo(0, 0); // (-150 + 150) / 2 = 0
      expect(avgY).toBeCloseTo(50, 0); // (-100 + 200) / 2 = 50
    });

    it("should center nodes around origin with proper padding", () => {
      const data: NodeEditorData = {
        nodes: {
          node1: {
            id: "node1",
            type: "default",
            position: { x: -500, y: -500 },
            size: { width: 150, height: 50 },
            data: { title: "Node 1" },
          },
          node2: {
            id: "node2",
            type: "default",
            position: { x: 500, y: 500 },
            size: { width: 150, height: 50 },
            data: { title: "Node 2" },
          },
        },
        connections: {},
      };

      const padding = 100;
      const result = calculateAutoLayout(data, { iterations: 0, padding });

      // Calculate expected bounds including node sizes
      const _node1Right = -500 + 150; // -350
      const _node1Bottom = -500 + 50; // -450
      const node2Right = 500 + 150; // 650
      const node2Bottom = 500 + 50; // 550

      const minX = -500;
      const maxX = node2Right; // 650
      const minY = -500;
      const maxY = node2Bottom; // 550

      const centerX = (minX + maxX) / 2; // 75
      const centerY = (minY + maxY) / 2; // 25

      // After centering with padding, node1 should be at:
      // x: -500 - centerX + padding = -500 - 75 + 100 = -475
      // y: -500 - centerY + padding = -500 - 25 + 100 = -425
      const pos1 = result.nodePositions["node1"];
      expect(pos1.x).toBeCloseTo(-500 - centerX + padding, 0);
      expect(pos1.y).toBeCloseTo(-500 - centerY + padding, 0);
    });

    it("should apply force-directed layout with connections", () => {
      const data: NodeEditorData = {
        nodes: {
          node1: {
            id: "node1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 1" },
          },
          node2: {
            id: "node2",
            type: "default",
            position: { x: 100, y: 0 },
            data: { title: "Node 2" },
          },
          node3: {
            id: "node3",
            type: "default",
            position: { x: 50, y: 100 },
            data: { title: "Node 3" },
          },
        },
        connections: {
          conn1: {
            id: "conn1",
            fromNodeId: "node1",
            fromPortId: "out",
            toNodeId: "node2",
            toPortId: "in",
          },
          conn2: {
            id: "conn2",
            fromNodeId: "node1",
            fromPortId: "out",
            toNodeId: "node3",
            toPortId: "in",
          },
        },
      };

      const result = calculateAutoLayout(data, { iterations: 50 });

      // All nodes should have positions
      expect(result.nodePositions["node1"]).toBeDefined();
      expect(result.nodePositions["node2"]).toBeDefined();
      expect(result.nodePositions["node3"]).toBeDefined();

      // Positions should be within reasonable bounds (considering padding)
      Object.values(result.nodePositions).forEach((pos) => {
        expect(Math.abs(pos.x)).toBeLessThan(5000);
        expect(Math.abs(pos.y)).toBeLessThan(5000);
      });
    });
  });

  describe("calculateHierarchicalLayout", () => {
    it("should arrange nodes in layers based on connectivity", () => {
      const data: NodeEditorData = {
        nodes: {
          node1: {
            id: "node1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 1" },
          },
          node2: {
            id: "node2",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 2" },
          },
          node3: {
            id: "node3",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 3" },
          },
        },
        connections: {
          conn1: {
            id: "conn1",
            fromNodeId: "node1",
            fromPortId: "out",
            toNodeId: "node2",
            toPortId: "in",
          },
          conn2: {
            id: "conn2",
            fromNodeId: "node2",
            fromPortId: "out",
            toNodeId: "node3",
            toPortId: "in",
          },
        },
      };

      const layerHeight = 200;
      const result = calculateHierarchicalLayout(data, { layerHeight });

      // node1 should be at layer 0 (y=0)
      expect(result.nodePositions["node1"].y).toBe(0);

      // node2 should be at layer 1 (y=200)
      expect(result.nodePositions["node2"].y).toBe(layerHeight);

      // node3 should be at layer 2 (y=400)
      expect(result.nodePositions["node3"].y).toBe(layerHeight * 2);
    });

    it("should handle disconnected nodes", () => {
      const data: NodeEditorData = {
        nodes: {
          node1: {
            id: "node1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 1" },
          },
          node2: {
            id: "node2",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 2" },
          },
        },
        connections: {},
      };

      const result = calculateHierarchicalLayout(data);

      // Both nodes should be at the same layer (y=0) since there are no connections
      expect(result.nodePositions["node1"].y).toBe(0);
      expect(result.nodePositions["node2"].y).toBe(0);
    });
  });

  describe("calculateGridLayout", () => {
    it("should arrange nodes in a centered grid", () => {
      const data: NodeEditorData = {
        nodes: {
          node1: {
            id: "node1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 1" },
          },
          node2: {
            id: "node2",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 2" },
          },
          node3: {
            id: "node3",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 3" },
          },
          node4: {
            id: "node4",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 4" },
          },
        },
        connections: {},
      };

      const spacing = 200;
      const result = calculateGridLayout(data, { spacing, columns: 2 });

      // With 4 nodes and 2 columns, we should have a 2x2 grid
      // Grid should be centered, so positions should be symmetric around origin
      const positions = Object.values(result.nodePositions);
      const xPositions = positions.map((p) => p.x);
      const yPositions = positions.map((p) => p.y);

      // X positions should include both negative and positive values (or zeros) if centered
      const sumX = xPositions.reduce((sum, x) => sum + x, 0);
      const sumY = yPositions.reduce((sum, y) => sum + y, 0);

      // Sum should be close to 0 if properly centered
      expect(Math.abs(sumX)).toBeLessThan(1);
      expect(Math.abs(sumY)).toBeLessThan(1);
    });

    it("should handle single node", () => {
      const data: NodeEditorData = {
        nodes: {
          node1: {
            id: "node1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { title: "Node 1" },
          },
        },
        connections: {},
      };

      const result = calculateGridLayout(data);

      // Single node should be at origin (centered)
      expect(result.nodePositions["node1"].x).toBe(0);
      expect(result.nodePositions["node1"].y).toBe(0);
    });
  });

  describe("empty data handling", () => {
    it("should handle empty node data", () => {
      const data: NodeEditorData = {
        nodes: {},
        connections: {},
      };

      expect(calculateAutoLayout(data).nodePositions).toEqual({});
      expect(calculateHierarchicalLayout(data).nodePositions).toEqual({});
      expect(calculateGridLayout(data).nodePositions).toEqual({});
    });
  });
});
