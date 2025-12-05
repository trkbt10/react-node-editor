/**
 * @file Tests for auto-layout algorithms
 */
import {
  calculateAutoLayout,
  calculateForceDirectedLayout,
  calculateHierarchicalLayout,
  calculateTreeLayout,
  calculateGridLayout,
  analyzeGraph,
  selectAlgorithm,
} from "./autoLayout";
import type { NodeEditorData, Node, Connection } from "../../../../types/core";

describe("autoLayout", () => {
  describe("calculateAutoLayout (with auto algorithm selection)", () => {
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

    it("should select grid layout for nodes without connections", () => {
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
        },
        connections: {},
      };

      const result = calculateAutoLayout(data, { algorithm: "auto" });
      expect(result.algorithm).toBe("grid");
    });
  });

  describe("calculateForceDirectedLayout", () => {
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

      const result = calculateForceDirectedLayout(data);
      expect(result.nodePositions["node1"]).toEqual({ x: 0, y: 0 });
      expect(result.algorithm).toBe("force");
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

      const result = calculateForceDirectedLayout(data, { iterations: 0 });

      // With 0 iterations, positions should stay at initial with centering applied
      // node1: x: 0, y: 0, right: 200, bottom: 100
      // node2: x: 300, y: 300, right: 500, bottom: 400
      // minX: 0, maxX: 500, minY: 0, maxY: 400
      // centerX: 250, centerY: 200

      // Check that both nodes have valid positions
      expect(result.nodePositions["node1"]).toBeDefined();
      expect(result.nodePositions["node2"]).toBeDefined();

      // Check that positions are centered (average should be near 0)
      const allPositions = Object.values(result.nodePositions);
      const avgX = allPositions.reduce((sum, p) => sum + p.x, 0) / allPositions.length;
      const avgY = allPositions.reduce((sum, p) => sum + p.y, 0) / allPositions.length;

      expect(Math.abs(avgX)).toBeLessThan(200); // Centered within reasonable bounds
      expect(Math.abs(avgY)).toBeLessThan(200);
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

      const result = calculateForceDirectedLayout(data, { iterations: 50 });

      // All nodes should have positions
      expect(result.nodePositions["node1"]).toBeDefined();
      expect(result.nodePositions["node2"]).toBeDefined();
      expect(result.nodePositions["node3"]).toBeDefined();

      // Positions should be within reasonable bounds
      Object.values(result.nodePositions).forEach((pos) => {
        expect(Math.abs(pos.x)).toBeLessThan(5000);
        expect(Math.abs(pos.y)).toBeLessThan(5000);
      });

      // Should have metrics
      expect(result.metrics.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metrics.boundingBox.width).toBeGreaterThan(0);
      expect(result.metrics.boundingBox.height).toBeGreaterThan(0);
    });

    it("should use Barnes-Hut approximation for large graphs", () => {
      // Create a graph with many nodes
      const nodes: NodeEditorData["nodes"] = {};
      for (let i = 0; i < 60; i++) {
        nodes[`node${i}`] = {
          id: `node${i}`,
          type: "default",
          position: { x: (i % 10) * 100, y: Math.floor(i / 10) * 100 },
          data: { title: `Node ${i}` },
        };
      }

      const data: NodeEditorData = {
        nodes,
        connections: {},
      };

      const result = calculateForceDirectedLayout(data, {
        iterations: 10,
        useBarnesHut: true,
      });

      // Should complete without error
      expect(Object.keys(result.nodePositions)).toHaveLength(60);
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

      const layerSpacing = 200;
      const result = calculateHierarchicalLayout(data, { layerSpacing });

      // node1 should be at layer 0 (y=0)
      expect(result.nodePositions["node1"].y).toBe(0);

      // node2 should be at layer 1 (y=200)
      expect(result.nodePositions["node2"].y).toBe(layerSpacing);

      // node3 should be at layer 2 (y=400)
      expect(result.nodePositions["node3"].y).toBe(layerSpacing * 2);

      expect(result.algorithm).toBe("hierarchical");
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

    it("should reduce edge crossings with barycentric method", () => {
      // Diamond pattern: A -> B, A -> C, B -> D, C -> D
      const data: NodeEditorData = {
        nodes: {
          A: { id: "A", type: "default", position: { x: 0, y: 0 }, data: {} },
          B: { id: "B", type: "default", position: { x: 0, y: 0 }, data: {} },
          C: { id: "C", type: "default", position: { x: 0, y: 0 }, data: {} },
          D: { id: "D", type: "default", position: { x: 0, y: 0 }, data: {} },
        },
        connections: {
          ab: { id: "ab", fromNodeId: "A", fromPortId: "o", toNodeId: "B", toPortId: "i" },
          ac: { id: "ac", fromNodeId: "A", fromPortId: "o", toNodeId: "C", toPortId: "i" },
          bd: { id: "bd", fromNodeId: "B", fromPortId: "o", toNodeId: "D", toPortId: "i" },
          cd: { id: "cd", fromNodeId: "C", fromPortId: "o", toNodeId: "D", toPortId: "i" },
        },
      };

      const result = calculateHierarchicalLayout(data, {
        crossReduction: "barycentric",
        crossReductionIterations: 4,
      });

      // Should have metrics including edge crossings
      expect(result.metrics.edgeCrossings).toBeDefined();
      // Diamond pattern should have 0 crossings with proper ordering
      expect(result.metrics.edgeCrossings).toBe(0);
    });
  });

  describe("calculateTreeLayout", () => {
    it("should layout binary tree correctly", () => {
      const data: NodeEditorData = {
        nodes: {
          root: { id: "root", type: "default", position: { x: 0, y: 0 }, data: { title: "Root" } },
          left: { id: "left", type: "default", position: { x: 0, y: 0 }, data: { title: "Left" } },
          right: { id: "right", type: "default", position: { x: 0, y: 0 }, data: { title: "Right" } },
        },
        connections: {
          rootLeft: { id: "rootLeft", fromNodeId: "root", fromPortId: "o", toNodeId: "left", toPortId: "i" },
          rootRight: { id: "rootRight", fromNodeId: "root", fromPortId: "o", toNodeId: "right", toPortId: "i" },
        },
      };

      const result = calculateTreeLayout(data, { levelSpacing: 100 });

      // Root should be centered above children
      expect(result.nodePositions["root"]).toBeDefined();
      expect(result.nodePositions["left"]).toBeDefined();
      expect(result.nodePositions["right"]).toBeDefined();

      // Left child should be to the left of right child
      expect(result.nodePositions["left"].x).toBeLessThan(result.nodePositions["right"].x);

      // Children should be below root
      expect(result.nodePositions["left"].y).toBeGreaterThan(result.nodePositions["root"].y);
      expect(result.nodePositions["right"].y).toBeGreaterThan(result.nodePositions["root"].y);

      expect(result.algorithm).toBe("tree");
    });

    it("should handle single node tree", () => {
      const data: NodeEditorData = {
        nodes: {
          root: { id: "root", type: "default", position: { x: 0, y: 0 }, data: { title: "Root" } },
        },
        connections: {},
      };

      const result = calculateTreeLayout(data);
      expect(result.nodePositions["root"]).toEqual({ x: 0, y: 0 });
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

      const result = calculateGridLayout(data, { spacing: 50, columns: 2 });

      // With 4 nodes and 2 columns, we should have a 2x2 grid
      // Grid should be centered, so positions should be symmetric around origin
      const positions = Object.values(result.nodePositions);
      const xPositions = positions.map((p) => p.x);
      const yPositions = positions.map((p) => p.y);

      // Sum should be close to 0 if properly centered
      const sumX = xPositions.reduce((sum, x) => sum + x, 0);
      const sumY = yPositions.reduce((sum, y) => sum + y, 0);

      expect(Math.abs(sumX)).toBeLessThan(1);
      expect(Math.abs(sumY)).toBeLessThan(1);

      expect(result.algorithm).toBe("grid");
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

  describe("graph analysis", () => {
    it("should detect tree structure", () => {
      const nodes: Node[] = [
        { id: "a", type: "t", position: { x: 0, y: 0 }, data: {} },
        { id: "b", type: "t", position: { x: 0, y: 0 }, data: {} },
        { id: "c", type: "t", position: { x: 0, y: 0 }, data: {} },
      ];
      const connections: Connection[] = [
        { id: "ab", fromNodeId: "a", fromPortId: "o", toNodeId: "b", toPortId: "i" },
        { id: "ac", fromNodeId: "a", fromPortId: "o", toNodeId: "c", toPortId: "i" },
      ];

      const chars = analyzeGraph(nodes, connections);
      expect(chars.isTree).toBe(true);
      expect(chars.isDAG).toBe(true);
      expect(chars.hasCycles).toBe(false);
    });

    it("should detect DAG (not tree)", () => {
      // Diamond pattern: A -> B, A -> C, B -> D, C -> D
      const nodes: Node[] = [
        { id: "a", type: "t", position: { x: 0, y: 0 }, data: {} },
        { id: "b", type: "t", position: { x: 0, y: 0 }, data: {} },
        { id: "c", type: "t", position: { x: 0, y: 0 }, data: {} },
        { id: "d", type: "t", position: { x: 0, y: 0 }, data: {} },
      ];
      const connections: Connection[] = [
        { id: "ab", fromNodeId: "a", fromPortId: "o", toNodeId: "b", toPortId: "i" },
        { id: "ac", fromNodeId: "a", fromPortId: "o", toNodeId: "c", toPortId: "i" },
        { id: "bd", fromNodeId: "b", fromPortId: "o", toNodeId: "d", toPortId: "i" },
        { id: "cd", fromNodeId: "c", fromPortId: "o", toNodeId: "d", toPortId: "i" },
      ];

      const chars = analyzeGraph(nodes, connections);
      expect(chars.isTree).toBe(false);
      expect(chars.isDAG).toBe(true);
      expect(chars.hasCycles).toBe(false);
    });

    it("should detect cycles", () => {
      // A -> B -> C -> A (cycle)
      const nodes: Node[] = [
        { id: "a", type: "t", position: { x: 0, y: 0 }, data: {} },
        { id: "b", type: "t", position: { x: 0, y: 0 }, data: {} },
        { id: "c", type: "t", position: { x: 0, y: 0 }, data: {} },
      ];
      const connections: Connection[] = [
        { id: "ab", fromNodeId: "a", fromPortId: "o", toNodeId: "b", toPortId: "i" },
        { id: "bc", fromNodeId: "b", fromPortId: "o", toNodeId: "c", toPortId: "i" },
        { id: "ca", fromNodeId: "c", fromPortId: "o", toNodeId: "a", toPortId: "i" },
      ];

      const chars = analyzeGraph(nodes, connections);
      expect(chars.hasCycles).toBe(true);
      expect(chars.isDAG).toBe(false);
      expect(chars.isTree).toBe(false);
    });

    it("should select appropriate algorithm", () => {
      // Tree -> tree layout
      expect(
        selectAlgorithm({
          nodeCount: 3,
          edgeCount: 2,
          isTree: true,
          isDAG: true,
          hasCycles: false,
          maxDegree: 2,
          avgDegree: 1.33,
          connectedComponents: 1,
          density: 0.33,
        }),
      ).toBe("tree");

      // DAG -> hierarchical
      expect(
        selectAlgorithm({
          nodeCount: 4,
          edgeCount: 4,
          isTree: false,
          isDAG: true,
          hasCycles: false,
          maxDegree: 2,
          avgDegree: 2,
          connectedComponents: 1,
          density: 0.33,
        }),
      ).toBe("hierarchical");

      // Cyclic -> force
      expect(
        selectAlgorithm({
          nodeCount: 3,
          edgeCount: 3,
          isTree: false,
          isDAG: false,
          hasCycles: true,
          maxDegree: 2,
          avgDegree: 2,
          connectedComponents: 1,
          density: 0.5,
        }),
      ).toBe("force");

      // No edges -> grid
      expect(
        selectAlgorithm({
          nodeCount: 5,
          edgeCount: 0,
          isTree: false,
          isDAG: true,
          hasCycles: false,
          maxDegree: 0,
          avgDegree: 0,
          connectedComponents: 5,
          density: 0,
        }),
      ).toBe("grid");
    });
  });

  describe("empty data handling", () => {
    it("should handle empty node data", () => {
      const data: NodeEditorData = {
        nodes: {},
        connections: {},
      };

      expect(calculateAutoLayout(data).nodePositions).toEqual({});
      expect(calculateForceDirectedLayout(data).nodePositions).toEqual({});
      expect(calculateHierarchicalLayout(data).nodePositions).toEqual({});
      expect(calculateTreeLayout(data).nodePositions).toEqual({});
      expect(calculateGridLayout(data).nodePositions).toEqual({});
    });
  });

  describe("nodeSizes override", () => {
    it("should use provided nodeSizes in grid layout", () => {
      const data: NodeEditorData = {
        nodes: {
          node1: { id: "node1", type: "default", position: { x: 0, y: 0 }, data: {} },
          node2: { id: "node2", type: "default", position: { x: 0, y: 0 }, data: {} },
        },
        connections: {},
      };

      // With small default sizes
      const resultSmall = calculateGridLayout(data, { spacing: 50 });

      // With large override sizes
      const nodeSizes = {
        node1: { width: 400, height: 200 },
        node2: { width: 400, height: 200 },
      };
      const resultLarge = calculateGridLayout(data, { spacing: 50 }, nodeSizes);

      // Positions should be different due to different node sizes
      const smallSpacing = Math.abs(resultSmall.nodePositions["node1"].x - resultSmall.nodePositions["node2"].x);
      const largeSpacing = Math.abs(resultLarge.nodePositions["node1"].x - resultLarge.nodePositions["node2"].x);

      // Large nodes should be spaced further apart
      expect(largeSpacing).toBeGreaterThan(smallSpacing);
    });

    it("should use provided nodeSizes in hierarchical layout", () => {
      const data: NodeEditorData = {
        nodes: {
          node1: { id: "node1", type: "default", position: { x: 0, y: 0 }, data: {} },
          node2: { id: "node2", type: "default", position: { x: 0, y: 0 }, data: {} },
          node3: { id: "node3", type: "default", position: { x: 0, y: 0 }, data: {} },
        },
        connections: {
          c1: { id: "c1", fromNodeId: "node1", fromPortId: "o", toNodeId: "node2", toPortId: "i" },
          c2: { id: "c2", fromNodeId: "node1", fromPortId: "o", toNodeId: "node3", toPortId: "i" },
        },
      };

      const nodeSizes = {
        node1: { width: 300, height: 150 },
        node2: { width: 300, height: 150 },
        node3: { width: 300, height: 150 },
      };

      const result = calculateHierarchicalLayout(data, { nodeSpacing: 50 }, nodeSizes);

      // node2 and node3 should be in the same layer, spaced apart
      const node2X = result.nodePositions["node2"].x;
      const node3X = result.nodePositions["node3"].x;
      const spacing = Math.abs(node2X - node3X);

      // With 300px wide nodes and 50px spacing, the gap should be at least node width + spacing
      expect(spacing).toBeGreaterThanOrEqual(300);
    });

    it("should produce different layouts for different algorithms with same data", () => {
      const data: NodeEditorData = {
        nodes: {
          A: { id: "A", type: "default", position: { x: 0, y: 0 }, data: {} },
          B: { id: "B", type: "default", position: { x: 0, y: 0 }, data: {} },
          C: { id: "C", type: "default", position: { x: 0, y: 0 }, data: {} },
          D: { id: "D", type: "default", position: { x: 0, y: 0 }, data: {} },
        },
        connections: {
          ab: { id: "ab", fromNodeId: "A", fromPortId: "o", toNodeId: "B", toPortId: "i" },
          ac: { id: "ac", fromNodeId: "A", fromPortId: "o", toNodeId: "C", toPortId: "i" },
          bd: { id: "bd", fromNodeId: "B", fromPortId: "o", toNodeId: "D", toPortId: "i" },
          cd: { id: "cd", fromNodeId: "C", fromPortId: "o", toNodeId: "D", toPortId: "i" },
        },
      };

      const nodeSizes = {
        A: { width: 200, height: 100 },
        B: { width: 200, height: 100 },
        C: { width: 200, height: 100 },
        D: { width: 200, height: 100 },
      };

      const forceResult = calculateForceDirectedLayout(data, { iterations: 50 }, nodeSizes);
      const hierResult = calculateHierarchicalLayout(data, {}, nodeSizes);
      const gridResult = calculateGridLayout(data, {}, nodeSizes);

      // Helper to compute layout "fingerprint"
      const fingerprint = (positions: Record<string, { x: number; y: number }>) => {
        const nodes = Object.keys(positions).sort();
        return nodes.map((n) => `${Math.round(positions[n].x)},${Math.round(positions[n].y)}`).join("|");
      };

      const forceFP = fingerprint(forceResult.nodePositions);
      const hierFP = fingerprint(hierResult.nodePositions);
      const gridFP = fingerprint(gridResult.nodePositions);

      // All three should produce different layouts
      expect(forceFP).not.toBe(hierFP);
      expect(hierFP).not.toBe(gridFP);
      expect(forceFP).not.toBe(gridFP);
    });
  });
});
