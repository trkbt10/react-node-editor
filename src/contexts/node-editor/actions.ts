import type { Connection, ConnectionId, Node, NodeEditorData, NodeId, Position } from "../../types/core";

export type NodeEditorAction =
  | { type: "ADD_NODE"; payload: { node: Omit<Node, "id"> } }
  | { type: "ADD_NODE_WITH_ID"; payload: { node: Node } }
  | { type: "UPDATE_NODE"; payload: { nodeId: NodeId; updates: Partial<Node> } }
  | { type: "DELETE_NODE"; payload: { nodeId: NodeId } }
  | { type: "MOVE_NODE"; payload: { nodeId: NodeId; position: Position } }
  | { type: "MOVE_NODES"; payload: { updates: Record<NodeId, Position> } }
  | { type: "ADD_CONNECTION"; payload: { connection: Omit<Connection, "id">; allowMultiToPort?: boolean } }
  | { type: "DELETE_CONNECTION"; payload: { connectionId: ConnectionId } }
  | { type: "SET_NODE_DATA"; payload: { data: NodeEditorData } }
  | { type: "RESTORE_STATE"; payload: { data: NodeEditorData } }
  | { type: "DUPLICATE_NODES"; payload: { nodeIds: NodeId[] } }
  | { type: "GROUP_NODES"; payload: { nodeIds: NodeId[]; groupId?: NodeId } }
  | { type: "UNGROUP_NODE"; payload: { groupId: NodeId } }
  | { type: "UPDATE_GROUP_MEMBERSHIP"; payload: { updates: Record<NodeId, { parentId?: NodeId }> } }
  | { type: "MOVE_GROUP_WITH_CHILDREN"; payload: { groupId: NodeId; delta: { x: number; y: number } } }
  | { type: "AUTO_LAYOUT"; payload: { layoutType: "force" | "hierarchical" | "grid"; selectedOnly?: boolean } };

export const nodeEditorActions = {
  addNode: (node: Omit<Node, "id">): NodeEditorAction => ({
    type: "ADD_NODE",
    payload: { node },
  }),
  addNodeWithId: (node: Node): NodeEditorAction => ({
    type: "ADD_NODE_WITH_ID",
    payload: { node },
  }),
  updateNode: (nodeId: NodeId, updates: Partial<Node>): NodeEditorAction => ({
    type: "UPDATE_NODE",
    payload: { nodeId, updates },
  }),
  deleteNode: (nodeId: NodeId): NodeEditorAction => ({
    type: "DELETE_NODE",
    payload: { nodeId },
  }),
  moveNode: (nodeId: NodeId, position: Position): NodeEditorAction => ({
    type: "MOVE_NODE",
    payload: { nodeId, position },
  }),
  moveNodes: (updates: Record<NodeId, Position>): NodeEditorAction => ({
    type: "MOVE_NODES",
    payload: { updates },
  }),
  addConnection: (connection: Omit<Connection, "id">, options?: { allowMultiToPort?: boolean }): NodeEditorAction => ({
    type: "ADD_CONNECTION",
    payload: { connection, allowMultiToPort: options?.allowMultiToPort },
  }),
  deleteConnection: (connectionId: ConnectionId): NodeEditorAction => ({
    type: "DELETE_CONNECTION",
    payload: { connectionId },
  }),
  setNodeData: (data: NodeEditorData): NodeEditorAction => ({
    type: "SET_NODE_DATA",
    payload: { data },
  }),
  restoreState: (data: NodeEditorData): NodeEditorAction => ({
    type: "RESTORE_STATE",
    payload: { data },
  }),
  duplicateNodes: (nodeIds: NodeId[]): NodeEditorAction => ({
    type: "DUPLICATE_NODES",
    payload: { nodeIds },
  }),
  groupNodes: (nodeIds: NodeId[], groupId?: NodeId): NodeEditorAction => ({
    type: "GROUP_NODES",
    payload: { nodeIds, groupId },
  }),
  ungroupNode: (groupId: NodeId): NodeEditorAction => ({
    type: "UNGROUP_NODE",
    payload: { groupId },
  }),
  updateGroupMembership: (updates: Record<NodeId, { parentId?: NodeId }>): NodeEditorAction => ({
    type: "UPDATE_GROUP_MEMBERSHIP",
    payload: { updates },
  }),
  moveGroupWithChildren: (groupId: NodeId, delta: { x: number; y: number }): NodeEditorAction => ({
    type: "MOVE_GROUP_WITH_CHILDREN",
    payload: { groupId, delta },
  }),
  autoLayout: (layoutType: "force" | "hierarchical" | "grid", selectedOnly?: boolean): NodeEditorAction => ({
    type: "AUTO_LAYOUT",
    payload: { layoutType, selectedOnly },
  }),
};

export type { NodeEditorData };
