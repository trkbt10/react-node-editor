/**
 * @file Node editor reducer
 * Handles all state transitions for the node editor including node/connection CRUD,
 * group operations, clipboard operations, and layout triggers
 */
import type { Node, NodeEditorData, NodeId } from "../../types/core";
import type { NodeEditorAction } from "./actions";
import type { NodeDefinition } from "../../types/NodeDefinition";
import { nodeHasGroupBehavior } from "../../types/behaviors";
import { copyNodesToClipboard, pasteNodesFromClipboard } from "./utils/nodeClipboardOperations";

export const nodeEditorReducer = (
  state: NodeEditorData,
  action: NodeEditorAction,
  nodeDefinitions: NodeDefinition[] = [],
): NodeEditorData => {
  switch (action.type) {
    case "ADD_NODE": {
      const id = generateId();
      const node = { ...action.payload.node, id } as Node;
      return { ...state, nodes: { ...state.nodes, [id]: node } };
    }
    case "ADD_NODE_WITH_ID": {
      const node = action.payload.node as Node;
      return { ...state, nodes: { ...state.nodes, [node.id]: node } };
    }
    case "UPDATE_NODE": {
      const { nodeId, updates } = action.payload;
      const node = state.nodes[nodeId];
      if (!node) {
        return state;
      }
      const nextNodes = { ...state.nodes, [nodeId]: { ...node, ...updates } as Node };

      // If a group node toggles visibility or lock, propagate to descendants
      const propagateVisibility = Object.prototype.hasOwnProperty.call(updates, "visible");
      const propagateLock = Object.prototype.hasOwnProperty.call(updates, "locked");
      if ((propagateVisibility || propagateLock) && nodeHasGroupBehavior(node, nodeDefinitions)) {
        const targetVisible = propagateVisibility ? updates.visible : undefined;
        const targetLocked = propagateLock ? updates.locked : undefined;

        if (typeof targetVisible !== "undefined" || typeof targetLocked !== "undefined") {
          const isDescendant = (childId: NodeId, ancestorId: NodeId): boolean => {
            const n = nextNodes[childId];
            if (!n) {
              return false;
            }
            if (n.parentId === ancestorId) {
              return true;
            }
            if (n.parentId) {
              return isDescendant(n.parentId, ancestorId);
            }
            return false;
          };

          Object.values(nextNodes).forEach((n) => {
            if (n.id !== nodeId && isDescendant(n.id, nodeId)) {
              nextNodes[n.id] = {
                ...n,
                ...(typeof targetVisible !== "undefined" ? { visible: targetVisible } : {}),
                ...(typeof targetLocked !== "undefined" ? { locked: targetLocked } : {}),
              };
            }
          });
        }
      }

      return { ...state, nodes: nextNodes };
    }
    case "DELETE_NODE": {
      const { nodeId } = action.payload;
      const { [nodeId]: _deleted, ...remainingNodes } = state.nodes;
      const remainingConnections = Object.entries(state.connections).reduce(
        (acc, [connId, conn]) => {
          if (conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId) {
            acc[connId] = conn;
          }
          return acc;
        },
        {} as typeof state.connections,
      );
      return { ...state, nodes: remainingNodes, connections: remainingConnections };
    }
    case "MOVE_NODE": {
      const { nodeId, position } = action.payload;
      const node = state.nodes[nodeId];
      if (!node) {
        return state;
      }
      return { ...state, nodes: { ...state.nodes, [nodeId]: { ...node, position } } };
    }
    case "MOVE_NODES": {
      const { updates } = action.payload;
      const updatedNodes = { ...state.nodes };
      Object.entries(updates).forEach(([nodeId, position]) => {
        const node = updatedNodes[nodeId];
        if (node) {
          updatedNodes[nodeId] = { ...node, position };
        }
      });
      return { ...state, nodes: updatedNodes };
    }
    case "ADD_CONNECTION": {
      const { connection } = action.payload;
      const id = generateId();
      // Assume upstream validation enforces maxConnections; reducer simply adds
      return { ...state, connections: { ...state.connections, [id]: { ...connection, id } } };
    }
    case "DELETE_CONNECTION": {
      const { connectionId } = action.payload;
      const { [connectionId]: _deleted, ...remaining } = state.connections;
      return { ...state, connections: remaining };
    }
    case "SET_NODE_DATA":
      return action.payload.data;
    case "RESTORE_STATE":
      return action.payload.data;
    case "DUPLICATE_NODES": {
      const { nodeIds } = action.payload;
      if (nodeIds.length === 0) {
        return state;
      }
      const newNodes: Record<NodeId, Node> = { ...state.nodes };
      const duplicatedNodeIds: NodeId[] = [];
      nodeIds.forEach((oldId) => {
        const originalNode = state.nodes[oldId];
        if (!originalNode) {
          return;
        }
        const newId = generateId();
        duplicatedNodeIds.push(newId);
        const duplicatedNode: Node = {
          ...originalNode,
          id: newId,
          position: { x: originalNode.position.x + 50, y: originalNode.position.y + 50 },
          data: {
            ...originalNode.data,
            title: originalNode.data.title ? `${originalNode.data.title} Copy` : `Node Copy`,
            createdAt: Date.now(),
          },
        };
        if (nodeHasGroupBehavior(duplicatedNode, nodeDefinitions)) {
          duplicatedNode.children = [];
        }
        newNodes[newId] = duplicatedNode;
      });
      return { ...state, nodes: newNodes, lastDuplicatedNodeIds: duplicatedNodeIds };
    }
    case "GROUP_NODES": {
      const { nodeIds, groupId = generateId() } = action.payload;
      if (nodeIds.length === 0) {
        return state;
      }
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      nodeIds.forEach((id) => {
        const node = state.nodes[id];
        if (node) {
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + (node.size?.width || 100));
          maxY = Math.max(maxY, node.position.y + (node.size?.height || 50));
        }
      });
      const groupNode: Node = {
        id: groupId,
        type: "group",
        position: { x: minX - 20, y: minY - 40 },
        size: { width: maxX - minX + 40, height: maxY - minY + 60 },
        data: { title: "Group" },
        children: nodeIds,
        expanded: true,
      };
      return { ...state, nodes: { ...state.nodes, [groupId]: groupNode } };
    }
    case "UNGROUP_NODE": {
      const { groupId } = action.payload;
      const group = state.nodes[groupId];
      if (!group || !nodeHasGroupBehavior(group, nodeDefinitions)) {
        return state;
      }
      const { [groupId]: _deleted, ...remainingNodes } = state.nodes;
      return { ...state, nodes: remainingNodes };
    }
    case "UPDATE_GROUP_MEMBERSHIP": {
      const { updates } = action.payload;
      const updatedNodes = { ...state.nodes };
      Object.entries(updates).forEach(([nodeId, update]) => {
        const node = updatedNodes[nodeId];
        if (node) {
          updatedNodes[nodeId] = { ...node, ...update } as Node;
        }
      });
      return { ...state, nodes: updatedNodes };
    }
    case "MOVE_GROUP_WITH_CHILDREN": {
      const { groupId, delta } = action.payload;
      const updatedNodes = { ...state.nodes };
      const groupNode = updatedNodes[groupId];
      if (groupNode) {
        updatedNodes[groupId] = {
          ...groupNode,
          position: { x: groupNode.position.x + delta.x, y: groupNode.position.y + delta.y },
        };
        Object.values(updatedNodes).forEach((node) => {
          if (node.parentId === groupId) {
            updatedNodes[node.id] = {
              ...node,
              position: { x: node.position.x + delta.x, y: node.position.y + delta.y },
            };
          }
        });
      }
      return { ...state, nodes: updatedNodes };
    }
    case "AUTO_LAYOUT": {
      return state; // trigger-only; actual layout handled elsewhere
    }
    case "COPY_NODES": {
      const { nodeIds } = action.payload;
      copyNodesToClipboard(nodeIds, state);
      return state; // No state change, only clipboard side effect
    }
    case "PASTE_NODES": {
      const { offsetX = 40, offsetY = 40 } = action.payload;
      const pasteResult = pasteNodesFromClipboard(offsetX, offsetY);
      if (!pasteResult) {
        return state;
      }
      const newNodes = { ...state.nodes };
      const newConnections = { ...state.connections };

      // Add pasted nodes
      pasteResult.nodes.forEach((node) => {
        newNodes[node.id] = node as Node;
      });

      // Add pasted connections
      pasteResult.connections.forEach((conn) => {
        const id = generateId();
        newConnections[id] = { ...conn, id };
      });

      return {
        ...state,
        nodes: newNodes,
        connections: newConnections,
      };
    }
    default:
      return state;
  }
};

export const defaultNodeEditorData: NodeEditorData = { nodes: {}, connections: {} };

/**
 * Generates a unique random identifier string
 * @returns A random 8-character alphanumeric string
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export type { NodeEditorData };
