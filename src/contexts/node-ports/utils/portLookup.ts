/**
 * @file Port lookup utilities for creating fast access maps and cached port resolution
 */
import type { Node, Port, NodeId } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { getNodePorts } from "./portResolution";

/**
 * Port resolver interface
 */
export type PortResolver = {
  /** Get all ports for a node */
  getNodePorts(node: Node, definition: NodeDefinition): Port[];
  /** Create a lookup map for all ports */
  createPortLookupMap(
    nodes: Record<NodeId, Node>,
    getDefinition: (type: string) => NodeDefinition | undefined,
  ): Map<string, { node: Node; port: Port }>;
};

/**
 * Create a lookup map for quick port access
 * Key format: "nodeId:portId"
 */
export function createPortLookupMap(
  nodes: Record<NodeId, Node>,
  getDefinition: (type: string) => NodeDefinition | undefined,
): Map<string, { node: Node; port: Port }> {
  const map = new Map<string, { node: Node; port: Port }>();

  for (const node of Object.values(nodes)) {
    const definition = getDefinition(node.type);
    if (!definition) {
      continue;
    }

    const ports = getNodePorts(node, definition);
    for (const port of ports) {
      const key = `${node.id}:${port.id}`;
      map.set(key, { node, port });
    }
  }

  return map;
}

/**
 * Create port resolver with caching
 */
export function createCachedPortResolver(): PortResolver & {
  clearCache: () => void;
  clearNodeCache: (nodeId: NodeId) => void;
} {
  // Cache for resolved ports per node
  const portCache = new Map<NodeId, Port[]>();

  return {
    getNodePorts(node: Node, definition: NodeDefinition): Port[] {
      const cacheKey = node.id;

      // Check cache first
      if (portCache.has(cacheKey)) {
        return portCache.get(cacheKey)!;
      }

      // Resolve ports
      const ports = getNodePorts(node, definition);

      // Cache the result
      portCache.set(cacheKey, ports);

      return ports;
    },

    createPortLookupMap(
      nodes: Record<NodeId, Node>,
      getDefinition: (type: string) => NodeDefinition | undefined,
    ): Map<string, { node: Node; port: Port }> {
      return createPortLookupMap(nodes, getDefinition);
    },

    clearCache() {
      portCache.clear();
    },

    clearNodeCache(nodeId: NodeId) {
      portCache.delete(nodeId);
    },
  };
}

/**
 * Default port resolver instance
 */
export const defaultPortResolver: PortResolver = {
  getNodePorts,
  createPortLookupMap,
};
