/**
 * @file Node-specific clipboard operations
 * This module provides domain-specific logic for copying/pasting nodes using the generic clipboard
 */
import type { NodeEditorData, NodeData, Position, Size } from "../types/core";
import { setClipboard, getClipboard, type ClipboardData } from "./clipboard";

/**
 * Copy selected nodes to clipboard
 * @param selectedNodeIds - IDs of nodes to copy
 * @param editorData - Current editor data
 * @returns ClipboardData containing copied nodes and connections
 */
export function copyNodesToClipboard(
  selectedNodeIds: string[],
  editorData: NodeEditorData
): ClipboardData | null {
  if (selectedNodeIds.length === 0) {
    return null;
  }

  const nodes = selectedNodeIds
    .map((id) => editorData.nodes[id])
    .filter(Boolean)
    .map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      size: n.size,
      data: n.data,
    }));

  const selSet = new Set(selectedNodeIds);
  const connections = Object.values(editorData.connections)
    .filter((c) => selSet.has(c.fromNodeId) && selSet.has(c.toNodeId))
    .map((c) => ({
      fromNodeId: c.fromNodeId,
      fromPortId: c.fromPortId,
      toNodeId: c.toNodeId,
      toPortId: c.toPortId,
    }));

  const clipboardData = { nodes, connections };
  setClipboard(clipboardData);
  return clipboardData;
}

/**
 * Paste nodes from clipboard with new IDs and offset positions
 * @param offsetX - X offset for pasted nodes (default: 40)
 * @param offsetY - Y offset for pasted nodes (default: 40)
 * @returns Object containing new node data and connection data, or null if clipboard is empty
 */
export function pasteNodesFromClipboard(
  offsetX = 40,
  offsetY = 40
): {
  nodes: Array<{
    id: string;
    type: string;
    position: Position;
    size?: Size;
    data: NodeData;
  }>;
  connections: Array<{
    fromNodeId: string;
    fromPortId: string;
    toNodeId: string;
    toPortId: string;
  }>;
  idMap: Map<string, string>;
} | null {
  const clip = getClipboard();
  if (!clip || clip.nodes.length === 0) {
    return null;
  }

  const idMap = new Map<string, string>();

  // Create new nodes with new IDs and offset positions
  const nodes = clip.nodes.map((n) => {
    const newId = Math.random().toString(36).slice(2, 10);
    idMap.set(n.id, newId);
    const baseData = n.data || {};
    return {
      id: newId,
      type: n.type,
      position: { x: n.position.x + offsetX, y: n.position.y + offsetY },
      size: n.size,
      data: {
        ...baseData,
        title:
          typeof baseData.title === "string"
            ? `${baseData.title} Copy`
            : baseData.title,
      } as NodeData,
    };
  });

  // Recreate internal connections with new IDs
  const connections = clip.connections
    .map((c) => {
      const fromId = idMap.get(c.fromNodeId);
      const toId = idMap.get(c.toNodeId);
      if (fromId && toId) {
        return {
          fromNodeId: fromId,
          fromPortId: c.fromPortId,
          toNodeId: toId,
          toPortId: c.toPortId,
        };
      }
      return null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return { nodes, connections, idMap };
}
