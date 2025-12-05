/**
 * @file Logic for handling connection switching behavior when ports reach capacity limits
 * Pure functions for planning connection changes
 */
import type { Connection, Node, NodeId, Port } from "../../types/core";
import type { NodeDefinition } from "../../types/NodeDefinition";
import { createValidatedConnection } from "../connection/operations";
import { getPortDefinition } from "./definition";
import { checkPortCapacity } from "./queries";

/**
 * How the editor should respond when a port at capacity is used to start a new connection drag.
 */
export enum ConnectionSwitchBehavior {
  /** Simply append the new connection */
  Append = "append",
  /** Ignore the drag result completely */
  Ignore = "ignore",
}

export type BehaviorContext = {
  behavior: ConnectionSwitchBehavior;
  existingConnections: Connection[];
  maxConnections?: number;
};

/**
 * Parameters required to plan how a drag between two ports should be handled.
 */
export type ConnectionPlanParams = {
  fromPort: Port;
  toPort: Port;
  nodes: Record<NodeId, Node>;
  connections: Record<string, Connection>;
  getNodeDefinition: (type: string) => NodeDefinition | undefined;
};

/**
 * Result of evaluating how to handle a connection drag.
 */
export type ConnectionPlan = {
  behavior: ConnectionSwitchBehavior;
  connection: Omit<Connection, "id"> | null;
  connectionIdsToReplace: string[];
};

const determineBehaviorForPort = (
  port: Port,
  nodes: Record<NodeId, Node>,
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined,
): BehaviorContext => {
  const node = nodes[port.nodeId];
  const definition = node ? getNodeDefinition(node.type) : undefined;
  const portDefinition = definition ? getPortDefinition(port, definition) : undefined;
  const direction = port.type === "output" ? "from" : "to";

  // Use checkPortCapacity as single source of truth for capacity logic
  const capacityResult = checkPortCapacity(port, connections, direction, portDefinition);

  const behavior = capacityResult.atCapacity
    ? ConnectionSwitchBehavior.Ignore
    : ConnectionSwitchBehavior.Append;

  return {
    behavior,
    existingConnections: capacityResult.existingConnections,
    maxConnections: capacityResult.maxConnections,
  };
};

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

/**
 * Get the connection switch context for a given port.
 * Used to determine how to handle connections when a port is at or near capacity.
 */
export const getConnectionSwitchContext = (
  port: Port,
  nodes: Record<NodeId, Node>,
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined,
): BehaviorContext => determineBehaviorForPort(port, nodes, connections, getNodeDefinition);
