/**
 * @file Node and connection lookup utilities for the node editor
 * Provides optimized lookup maps and spatial indexing data structures
 * for efficient O(1) access to nodes, connections, ports, and spatial queries
 */
import type { Node, NodeId, Connection, ConnectionId, Port, PortId } from "../../../../types/core";
import type { PortKey } from "../../../../core/port/identity/key";
import { createPortKey } from "../../../../core/port/identity/key";

/**
 * Create a lookup map from port ID to node ID
 * @param nodes - The nodes object
 * @param getNodePorts - Optional function to get ports for a node. If not provided, will use node.ports directly
 */
export function createPortToNodeMap(
  nodes: Record<NodeId, Node>,
  getNodePorts?: (nodeId: NodeId) => Port[],
): Map<PortId, NodeId> {
  const map = new Map<PortId, NodeId>();

  Object.entries(nodes).forEach(([nodeId]) => {
    const ports = getNodePorts ? getNodePorts(nodeId) : [];
    ports.forEach((port) => {
      map.set(port.id, nodeId);
    });
  });

  return map;
}

/**
 * Create a lookup map from parent ID to child node IDs
 */
export function createParentToChildrenMap(nodes: Record<NodeId, Node>): Map<NodeId, NodeId[]> {
  const map = new Map<NodeId, NodeId[]>();

  Object.entries(nodes).forEach(([nodeId, node]) => {
    if (node.parentId) {
      if (!map.has(node.parentId)) {
        map.set(node.parentId, []);
      }
      map.get(node.parentId)!.push(nodeId);
    }
  });

  return map;
}

/**
 * Create lookup maps for connections by endpoints
 */
export function createConnectionLookupMaps(connections: Record<ConnectionId, Connection>): {
  byFromNode: Map<NodeId, Connection[]>;
  byToNode: Map<NodeId, Connection[]>;
  byFromPort: Map<PortId, Connection[]>;
  byToPort: Map<PortId, Connection[]>;
  byEndpoint: Map<PortKey, Connection[]>; // "nodeId:portId" -> connections
} {
  const byFromNode = new Map<NodeId, Connection[]>();
  const byToNode = new Map<NodeId, Connection[]>();
  const byFromPort = new Map<PortId, Connection[]>();
  const byToPort = new Map<PortId, Connection[]>();
  const byEndpoint = new Map<PortKey, Connection[]>();

  Object.values(connections).forEach((connection) => {
    // By node
    if (!byFromNode.has(connection.fromNodeId)) {
      byFromNode.set(connection.fromNodeId, []);
    }
    if (!byToNode.has(connection.toNodeId)) {
      byToNode.set(connection.toNodeId, []);
    }
    byFromNode.get(connection.fromNodeId)!.push(connection);
    byToNode.get(connection.toNodeId)!.push(connection);

    // By port
    if (!byFromPort.has(connection.fromPortId)) {
      byFromPort.set(connection.fromPortId, []);
    }
    if (!byToPort.has(connection.toPortId)) {
      byToPort.set(connection.toPortId, []);
    }
    byFromPort.get(connection.fromPortId)!.push(connection);
    byToPort.get(connection.toPortId)!.push(connection);

    // By endpoint (nodeId:portId)
    const fromEndpoint = createPortKey(connection.fromNodeId, connection.fromPortId);
    const toEndpoint = createPortKey(connection.toNodeId, connection.toPortId);

    if (!byEndpoint.has(fromEndpoint)) {
      byEndpoint.set(fromEndpoint, []);
    }
    if (!byEndpoint.has(toEndpoint)) {
      byEndpoint.set(toEndpoint, []);
    }
    byEndpoint.get(fromEndpoint)!.push(connection);
    byEndpoint.get(toEndpoint)!.push(connection);
  });

  return { byFromNode, byToNode, byFromPort, byToPort, byEndpoint };
}

/**
 * Create a lookup map from position to ports on a node
 */
export function createPortsByPositionMap(ports: Port[]): Map<string, Port[]> {
  const map = new Map<string, Port[]>();

  ports.forEach((port) => {
    const position = port.position;
    if (!map.has(position)) {
      map.set(position, []);
    }
    map.get(position)!.push(port);
  });

  return map;
}

/**
 * Group array items by a key function
 */
export function groupBy<T, K extends string | number>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();

  items.forEach((item) => {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  });

  return map;
}

/**
 * Create a spatial grid for efficient spatial queries
 */
export class SpatialGrid<T> {
  private cells: Map<string, T[]> = new Map();
  private cellSize: number;

  constructor(cellSize: number = 200) {
    this.cellSize = cellSize;
  }

  /**
   * Get cell key for a position
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Insert item at position
   */
  insert(item: T, x: number, y: number): void {
    const key = this.getCellKey(x, y);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key)!.push(item);
  }

  /**
   * Get all items in cells near a position
   */
  getNearby(x: number, y: number, radius: number = 1): T[] {
    const items: T[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellY = Math.floor(y / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx},${centerCellY + dy}`;
        const cellItems = this.cells.get(key);
        if (cellItems) {
          items.push(...cellItems);
        }
      }
    }

    return items;
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.cells.clear();
  }

  /**
   * Get all items in a rectangular area
   */
  getInArea(minX: number, minY: number, maxX: number, maxY: number): T[] {
    const items: T[] = [];
    const minCellX = Math.floor(minX / this.cellSize);
    const minCellY = Math.floor(minY / this.cellSize);
    const maxCellX = Math.floor(maxX / this.cellSize);
    const maxCellY = Math.floor(maxY / this.cellSize);

    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cellItems = this.cells.get(key);
        if (cellItems) {
          items.push(...cellItems);
        }
      }
    }

    return items;
  }
}
