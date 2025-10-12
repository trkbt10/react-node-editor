/**
 * @file Render optimization utilities using memoization for the node editor
 * Provides custom equality functions and hooks for optimizing React component re-renders
 * during node and connection rendering, especially for performance-critical drag operations
 */
import * as React from "react";
import { Node, Connection, NodeId, ConnectionId } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { nodeHasGroupBehavior } from "../../../types/behaviors";

/**
 * Custom equality function for nodes that ignores position changes during drag
 */
export function areNodesEqual(prevNode: Node, nextNode: Node, isDragging: boolean): boolean {
  if (!isDragging) {
    return prevNode === nextNode;
  }

  // During drag, ignore position changes
  return (
    prevNode.id === nextNode.id &&
    prevNode.type === nextNode.type &&
    prevNode.size?.width === nextNode.size?.width &&
    prevNode.size?.height === nextNode.size?.height &&
    prevNode.data === nextNode.data &&
    prevNode.locked === nextNode.locked &&
    prevNode.visible === nextNode.visible &&
    prevNode.expanded === nextNode.expanded
  );
}

/**
 * Custom equality function for connections that considers endpoint positions
 */
export function areConnectionsEqual(
  prevConnection: Connection,
  nextConnection: Connection,
  prevNodes: Record<NodeId, Node>,
  nextNodes: Record<NodeId, Node>,
): boolean {
  // Basic connection equality
  if (prevConnection !== nextConnection) {
    return false;
  }

  // Check if endpoint nodes have moved
  const prevFromNode = prevNodes[prevConnection.fromNodeId];
  const nextFromNode = nextNodes[nextConnection.fromNodeId];
  const prevToNode = prevNodes[prevConnection.toNodeId];
  const nextToNode = nextNodes[nextConnection.toNodeId];

  if (!prevFromNode || !nextFromNode || !prevToNode || !nextToNode) {
    return false;
  }

  // Check if positions or sizes have changed
  return (
    prevFromNode.position.x === nextFromNode.position.x &&
    prevFromNode.position.y === nextFromNode.position.y &&
    prevFromNode.size?.width === nextFromNode.size?.width &&
    prevFromNode.size?.height === nextFromNode.size?.height &&
    prevToNode.position.x === nextToNode.position.x &&
    prevToNode.position.y === nextToNode.position.y &&
    prevToNode.size?.width === nextToNode.size?.width &&
    prevToNode.size?.height === nextToNode.size?.height
  );
}

/**
 * Memoized sorted nodes calculation
 */
export function useSortedNodes(nodes: Record<NodeId, Node>, nodeDefinitions: NodeDefinition[]): Node[] {
  return React.useMemo(() => {
    return Object.values(nodes).sort((a, b) => {
      // Groups go to back
      const aIsGroup = nodeHasGroupBehavior(a, nodeDefinitions);
      const bIsGroup = nodeHasGroupBehavior(b, nodeDefinitions);
      if (aIsGroup && !bIsGroup) {
        return -1;
      }
      if (!aIsGroup && bIsGroup) {
        return 1;
      }

      // Within same type, sort by ID for stable ordering
      return a.id.localeCompare(b.id);
    });
  }, [nodes, nodeDefinitions]);
}

/**
 * Memoized connected ports calculation
 */
export function useConnectedPorts(connections: Record<ConnectionId, Connection>): Set<string> {
  return React.useMemo(() => {
    const connectedPorts = new Set<string>();
    Object.values(connections).forEach((connection) => {
      connectedPorts.add(connection.fromPortId);
      connectedPorts.add(connection.toPortId);
    });
    return connectedPorts;
  }, [connections]);
}

/**
 * Create a memoized component with custom comparison
 */
export function createMemoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean,
): React.ComponentType<P> {
  return React.memo(Component, propsAreEqual);
}
