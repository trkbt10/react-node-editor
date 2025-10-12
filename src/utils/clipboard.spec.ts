/**
 * @file Unit tests for generic clipboard utilities
 */
import { clearClipboard, getClipboard, setClipboard, type ClipboardData } from "./clipboard";

describe("clipboard", () => {
  beforeEach(() => {
    clearClipboard();
  });

  describe("basic clipboard operations", () => {
    it("should set and get clipboard data", () => {
      const data: ClipboardData = {
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
      const data: ClipboardData = {
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

    it("should return null for empty clipboard initially", () => {
      expect(getClipboard()).toBeNull();
    });

    it("should overwrite previous clipboard data", () => {
      const data1: ClipboardData = {
        nodes: [{ id: "node1", type: "default", position: { x: 0, y: 0 } }],
        connections: [],
      };
      const data2: ClipboardData = {
        nodes: [{ id: "node2", type: "default", position: { x: 100, y: 100 } }],
        connections: [],
      };

      setClipboard(data1);
      setClipboard(data2);

      expect(getClipboard()).toEqual(data2);
    });
  });
});
