import type { Connection, Node, NodeId, Port } from "../types/core";
import type { NodeDefinition, PortDefinition } from "../types/NodeDefinition";
import { createValidatedConnection } from "./nodeLayerHelpers";
import { getPortDefinition } from "./connectionValidation";

const DEFAULT_MAX_CONNECTIONS = 1;

/**
 * How the editor should respond when a port at capacity is used to start a new connection drag.
 */
export enum ConnectionSwitchBehavior {
  /** Simply append the new connection */
  Append = "append",
  /** Replace existing connections owned by the dragging port */
  Replace = "replace",
  /** Ignore the drag result completely */
  Ignore = "ignore",
}

type BehaviorContext = {
  behavior: ConnectionSwitchBehavior;
  existingConnections: Connection[];
  maxConnections?: number;
}

/**
 * Parameters required to plan how a drag between two ports should be handled.
 */
export type ConnectionPlanParams = {
  fromPort: Port;
  toPort: Port;
  nodes: Record<NodeId, Node>;
  connections: Record<string, Connection>;
  getNodeDefinition: (type: string) => NodeDefinition | undefined;
}

/**
 * Result of evaluating how to handle a connection drag.
 */
export type ConnectionPlan = {
  behavior: ConnectionSwitchBehavior;
  connection: Omit<Connection, "id"> | null;
  connectionIdsToReplace: string[];
}

const normalizeMaxConnections = (value: number | "unlimited" | undefined): number | undefined => {
  if (value === "unlimited") {return undefined;}
  if (typeof value === "number") {return value;}
  return DEFAULT_MAX_CONNECTIONS;
};

const getEffectiveMaxConnections = (port: Port, definition?: PortDefinition): number | undefined => {
  const configuredMax = port.maxConnections ?? definition?.maxConnections;
  return normalizeMaxConnections(configuredMax);
};

const collectConnectionsForPort = (port: Port, connections: Record<string, Connection>): Connection[] =>
  Object.values(connections).filter((connection) =>
    port.type === "output"
      ? connection.fromNodeId === port.nodeId && connection.fromPortId === port.id
      : connection.toNodeId === port.nodeId && connection.toPortId === port.id
  );

const determineBehaviorForPort = (
  port: Port,
  nodes: Record<NodeId, Node>,
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined
): BehaviorContext => {
  const node = nodes[port.nodeId];
  const definition = node ? getNodeDefinition(node.type) : undefined;
  const portDefinition = definition ? getPortDefinition(port, definition) : undefined;
  const maxConnections = getEffectiveMaxConnections(port, portDefinition);
  const existingConnections = collectConnectionsForPort(port, connections);

  if (maxConnections === undefined) {
    return { behavior: ConnectionSwitchBehavior.Append, existingConnections, maxConnections };
  }

  if (existingConnections.length < maxConnections) {
    return { behavior: ConnectionSwitchBehavior.Append, existingConnections, maxConnections };
  }

  if (maxConnections === 1) {
    return { behavior: ConnectionSwitchBehavior.Replace, existingConnections, maxConnections };
  }

  return { behavior: ConnectionSwitchBehavior.Ignore, existingConnections, maxConnections };
};

const createConnectionMapWithout = (
  connections: Record<string, Connection>,
  toRemove: Connection[]
): Record<string, Connection> => {
  if (toRemove.length === 0) {return connections;}
  const filtered: Record<string, Connection> = { ...connections };
  toRemove.forEach((connection) => {
    delete filtered[connection.id];
  });
  return filtered;
};

const isSameConnection = (existing: Connection, candidate: Omit<Connection, "id">): boolean =>
  existing.fromNodeId === candidate.fromNodeId &&
  existing.fromPortId === candidate.fromPortId &&
  existing.toNodeId === candidate.toNodeId &&
  existing.toPortId === candidate.toPortId;

/**
 * Decide how to handle a completed drag between two ports while respecting connection limits.
 */
export const planConnectionChange = ({
  fromPort,
  toPort,
  nodes,
  connections,
  getNodeDefinition,
}: ConnectionPlanParams): ConnectionPlan => {
  const behaviorContext = determineBehaviorForPort(fromPort, nodes, connections, getNodeDefinition);

  switch (behaviorContext.behavior) {
    case ConnectionSwitchBehavior.Replace: {
      const reducedConnections = createConnectionMapWithout(connections, behaviorContext.existingConnections);
      const connection = createValidatedConnection(fromPort, toPort, nodes, reducedConnections, getNodeDefinition);

      if (!connection) {
        return { behavior: ConnectionSwitchBehavior.Replace, connection: null, connectionIdsToReplace: [] };
      }

      const duplicatesExisting = behaviorContext.existingConnections.some((existingConnection) =>
        isSameConnection(existingConnection, connection)
      );

      if (duplicatesExisting) {
        return { behavior: ConnectionSwitchBehavior.Replace, connection: null, connectionIdsToReplace: [] };
      }

      return {
        behavior: ConnectionSwitchBehavior.Replace,
        connection,
        connectionIdsToReplace: behaviorContext.existingConnections.map((connectionToRemove) => connectionToRemove.id),
      };
    }

    case ConnectionSwitchBehavior.Ignore:
      return { behavior: ConnectionSwitchBehavior.Ignore, connection: null, connectionIdsToReplace: [] };

    case ConnectionSwitchBehavior.Append:
    default: {
      const connection = createValidatedConnection(fromPort, toPort, nodes, connections, getNodeDefinition);
      return {
        behavior: ConnectionSwitchBehavior.Append,
        connection: connection ?? null,
        connectionIdsToReplace: [],
      };
    }
  }
};

export type { BehaviorContext };

export const getConnectionSwitchContext = (
  port: Port,
  nodes: Record<NodeId, Node>,
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined
): BehaviorContext => determineBehaviorForPort(port, nodes, connections, getNodeDefinition);

export const createConnectionSnapshotWithout = (
  connections: Record<string, Connection>,
  toRemove: Connection[]
): Record<string, Connection> => createConnectionMapWithout(connections, toRemove);
