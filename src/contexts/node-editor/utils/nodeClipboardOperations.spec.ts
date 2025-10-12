/**
 * @file Unit tests for node clipboard operations
 */
import {
  copyNodesToClipboard,
  pasteNodesFromClipboard,
} from "./nodeClipboardOperations";
import { clearClipboard, getClipboard, setClipboard } from "../../../utils/clipboard";
import type { NodeEditorData } from "../../../types/core";

describe("clipboard", () => {
  beforeEach(() => {
    clearClipboard();
  });

  describe("basic clipboard operations", () => {
    it("should set and get clipboard data", () => {
      const data = {
        nodes: [
          {
            id: "node1",
            type: "default",
            position: { x: 100, y: 200 },
            size: { width: 150, height: 100 },
            data: { title: "Test Node" },
          },
        ],
        connections: [],
      };

      setClipboard(data);
      const result = getClipboard();

      expect(result).toEqual(data);
    });

    it("should clear clipboard", () => {
      const data = {
        nodes: [
          {
            id: "node1",
            type: "default",
            position: { x: 100, y: 200 },
          },
        ],
        connections: [],
      };

      setClipboard(data);
      clearClipboard();

      expect(getClipboard()).toBeNull();
    });
  });

  describe("copyNodesToClipboard", () => {
    it("should copy selected nodes to clipboard", () => {
      const editorData: NodeEditorData = {
        nodes: {
          node1: {
            id: "node1",
            type: "default",
            position: { x: 100, y: 200 },
            size: { width: 150, height: 100 },
            data: { title: "Node 1" },
          },
          node2: {
            id: "node2",
            type: "default",
            position: { x: 300, y: 400 },
            size: { width: 150, height: 100 },
            data: { title: "Node 2" },
          },
        },
        connections: {
          conn1: {
            id: "conn1",
            fromNodeId: "node1",
            fromPortId: "port1",
            toNodeId: "node2",
            toPortId: "port2",
          },
        },
      };

      const result = copyNodesToClipboard(["node1", "node2"], editorData);

      expect(result).not.toBeNull();
      expect(result?.nodes).toHaveLength(2);
      expect(result?.nodes[0].id).toBe("node1");
      expect(result?.nodes[1].id).toBe("node2");
      expect(result?.connections).toHaveLength(1);
      expect(result?.connections[0].fromNodeId).toBe("node1");
      expect(result?.connections[0].toNodeId).toBe("node2");
    });

    it("should only copy connections between selected nodes", () => {
      const editorData: NodeEditorData = {
        nodes: {
          node1: {
            id: "node1",
            type: "default",
            position: { x: 100, y: 200 },
            data: {},
          },
          node2: {
            id: "node2",
            type: "default",
            position: { x: 300, y: 400 },
            data: {},
          },
          node3: {
            id: "node3",
            type: "default",
            position: { x: 500, y: 600 },
            data: {},
          },
        },
        connections: {
          conn1: {
            id: "conn1",
            fromNodeId: "node1",
            fromPortId: "port1",
            toNodeId: "node2",
            toPortId: "port2",
          },
          conn2: {
            id: "conn2",
            fromNodeId: "node2",
            fromPortId: "port2",
            toNodeId: "node3",
            toPortId: "port3",
          },
        },
      };

      const result = copyNodesToClipboard(["node1", "node2"], editorData);

      expect(result?.connections).toHaveLength(1);
      expect(result?.connections[0].fromNodeId).toBe("node1");
    });

    it("should return null for empty selection", () => {
      const editorData: NodeEditorData = {
        nodes: {},
        connections: {},
      };

      const result = copyNodesToClipboard([], editorData);

      expect(result).toBeNull();
    });

    it("should filter out non-existent nodes", () => {
      const editorData: NodeEditorData = {
        nodes: {
          node1: {
            id: "node1",
            type: "default",
            position: { x: 100, y: 200 },
            data: {},
          },
        },
        connections: {},
      };

      const result = copyNodesToClipboard(["node1", "nonexistent"], editorData);

      expect(result?.nodes).toHaveLength(1);
      expect(result?.nodes[0].id).toBe("node1");
    });
  });

  describe("pasteNodesFromClipboard", () => {
    it("should paste nodes with new IDs and offset positions", () => {
      setClipboard({
        nodes: [
          {
            id: "original1",
            type: "default",
            position: { x: 100, y: 200 },
            size: { width: 150, height: 100 },
            data: { title: "Original Node" },
          },
        ],
        connections: [],
      });

      const result = pasteNodesFromClipboard(40, 40);

      expect(result).not.toBeNull();
      expect(result?.nodes).toHaveLength(1);
      expect(result?.nodes[0].id).not.toBe("original1");
      expect(result?.nodes[0].position).toEqual({ x: 140, y: 240 });
      expect(result?.nodes[0].data?.title).toBe("Original Node Copy");
      expect(result?.idMap.get("original1")).toBe(result?.nodes[0].id);
    });

    it("should use default offset values", () => {
      setClipboard({
        nodes: [
          {
            id: "original1",
            type: "default",
            position: { x: 100, y: 200 },
          },
        ],
        connections: [],
      });

      const result = pasteNodesFromClipboard();

      expect(result?.nodes[0].position).toEqual({ x: 140, y: 240 });
    });

    it("should remap connection IDs", () => {
      setClipboard({
        nodes: [
          {
            id: "original1",
            type: "default",
            position: { x: 100, y: 200 },
          },
          {
            id: "original2",
            type: "default",
            position: { x: 300, y: 400 },
          },
        ],
        connections: [
          {
            fromNodeId: "original1",
            fromPortId: "port1",
            toNodeId: "original2",
            toPortId: "port2",
          },
        ],
      });

      const result = pasteNodesFromClipboard();

      expect(result).not.toBeNull();
      expect(result?.connections).toHaveLength(1);

      const newNode1Id = result?.idMap.get("original1");
      const newNode2Id = result?.idMap.get("original2");

      expect(result?.connections[0].fromNodeId).toBe(newNode1Id);
      expect(result?.connections[0].toNodeId).toBe(newNode2Id);
      expect(result?.connections[0].fromPortId).toBe("port1");
      expect(result?.connections[0].toPortId).toBe("port2");
    });

    it("should filter out connections with unmapped nodes", () => {
      setClipboard({
        nodes: [
          {
            id: "original1",
            type: "default",
            position: { x: 100, y: 200 },
          },
        ],
        connections: [
          {
            fromNodeId: "original1",
            fromPortId: "port1",
            toNodeId: "nonexistent",
            toPortId: "port2",
          },
        ],
      });

      const result = pasteNodesFromClipboard();

      expect(result?.connections).toHaveLength(0);
    });

    it("should return null for empty clipboard", () => {
      const result = pasteNodesFromClipboard();

      expect(result).toBeNull();
    });

    it("should handle nodes without title in data", () => {
      setClipboard({
        nodes: [
          {
            id: "original1",
            type: "default",
            position: { x: 100, y: 200 },
            data: {},
          },
        ],
        connections: [],
      });

      const result = pasteNodesFromClipboard();

      expect(result?.nodes[0].data?.title).toBeUndefined();
    });

    it("should handle nodes with non-string title", () => {
      setClipboard({
        nodes: [
          {
            id: "original1",
            type: "default",
            position: { x: 100, y: 200 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: { title: 123 as any },
          },
        ],
        connections: [],
      });

      const result = pasteNodesFromClipboard();

      expect(result?.nodes[0].data?.title).toBe(123);
    });
  });
});
