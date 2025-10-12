import * as React from "react";
import type { Node, NodeId, Connection, Port } from "../../../types/core";
import type { NodeEditorAction } from "../../node-editor";
import type { ConstraintViolation } from "../../../types/NodeDefinition";
import {
  validateNodeConstraints,
  validateConnectionConstraints,
  hasBlockingViolations,
} from "../utils/constraintValidation";
import { useNodeDefinitions } from "../context";

export type ConstraintValidationHook = {
  /** Validate a node operation */
  validateNodeOperation: (
    node: Node,
    operation: "create" | "update" | "delete" | "move",
    allNodes: Record<NodeId, Node>,
    allConnections: Record<string, Connection>,
    context?: Record<string, unknown>,
  ) => { isValid: boolean; violations: ConstraintViolation[]; isBlocking: boolean };

  /** Validate a connection operation */
  validateConnectionOperation: (
    fromNode: Node,
    toNode: Node,
    operation: "connect" | "disconnect",
    allNodes: Record<NodeId, Node>,
    allConnections: Record<string, Connection>,
    context?: Record<string, unknown>,
  ) => { isValid: boolean; violations: ConstraintViolation[]; isBlocking: boolean };

  /** Check if an action should be allowed */
  canPerformAction: (
    action: NodeEditorAction,
    currentState: { nodes: Record<NodeId, Node>; connections: Record<string, Connection> },
  ) => { allowed: boolean; violations: ConstraintViolation[] };
};

/**
 * Hook for constraint validation
 */
export const useConstraintValidation = (getNodePorts?: (nodeId: NodeId) => Port[]): ConstraintValidationHook => {
  const { registry } = useNodeDefinitions();

  const validateNodeOperation = React.useCallback(
    (
      node: Node,
      operation: "create" | "update" | "delete" | "move",
      allNodes: Record<NodeId, Node>,
      allConnections: Record<string, Connection>,
      context?: Record<string, unknown>,
    ) => {
      const nodeDefinition = registry.get(node.type);

      if (!nodeDefinition) {
        return { isValid: true, violations: [], isBlocking: false };
      }

      const result = validateNodeConstraints(node, nodeDefinition, allNodes, allConnections, operation, context);

      const isBlocking = hasBlockingViolations(result.violations, nodeDefinition.constraints || []);

      return {
        isValid: result.isValid,
        violations: result.violations,
        isBlocking,
      };
    },
    [registry],
  );

  const validateConnectionOperation = React.useCallback(
    (
      fromNode: Node,
      toNode: Node,
      operation: "connect" | "disconnect",
      allNodes: Record<NodeId, Node>,
      allConnections: Record<string, Connection>,
      context?: Record<string, unknown>,
    ) => {
      const fromNodeDefinition = registry.get(fromNode.type);
      const toNodeDefinition = registry.get(toNode.type);

      if (!fromNodeDefinition || !toNodeDefinition) {
        return { isValid: true, violations: [], isBlocking: false };
      }

      const result = validateConnectionConstraints(
        fromNode,
        toNode,
        fromNodeDefinition,
        toNodeDefinition,
        allNodes,
        allConnections,
        operation,
        context,
      );

      const allConstraints = [...(fromNodeDefinition.constraints || []), ...(toNodeDefinition.constraints || [])];

      const isBlocking = hasBlockingViolations(result.violations, allConstraints);

      return {
        isValid: result.isValid,
        violations: result.violations,
        isBlocking,
      };
    },
    [registry],
  );

  const canPerformAction = React.useCallback(
    (
      action: NodeEditorAction,
      currentState: { nodes: Record<NodeId, Node>; connections: Record<string, Connection> },
    ): { allowed: boolean; violations: ConstraintViolation[] } => {
      const violations: ConstraintViolation[] = [];

      switch (action.type) {
        case "ADD_NODE": {
          // Create a temporary node with an ID for validation
          const tempNode: Node = {
            ...action.payload.node,
            id: "temp-" + Math.random().toString(36).slice(2, 8),
          } as Node;

          const result = validateNodeOperation(tempNode, "create", currentState.nodes, currentState.connections);

          violations.push(...result.violations);
          return { allowed: !result.isBlocking, violations };
        }

        case "UPDATE_NODE": {
          const existingNode = currentState.nodes[action.payload.nodeId];
          if (!existingNode) {
            return {
              allowed: false,
              violations: [
                {
                  type: "node-not-found",
                  message: "Node not found",
                  severity: "error",
                },
              ],
            };
          }

          const updatedNode: Node = { ...existingNode, ...action.payload.updates };
          const result = validateNodeOperation(updatedNode, "update", currentState.nodes, currentState.connections);

          violations.push(...result.violations);
          return { allowed: !result.isBlocking, violations };
        }

        case "DELETE_NODE": {
          const nodeToDelete = currentState.nodes[action.payload.nodeId];
          if (!nodeToDelete) {
            return { allowed: true, violations: [] };
          }

          const result = validateNodeOperation(nodeToDelete, "delete", currentState.nodes, currentState.connections);

          violations.push(...result.violations);
          return { allowed: !result.isBlocking, violations };
        }

        case "MOVE_NODE": {
          const nodeToMove = currentState.nodes[action.payload.nodeId];
          if (!nodeToMove) {
            return {
              allowed: false,
              violations: [
                {
                  type: "node-not-found",
                  message: "Node not found",
                  severity: "error",
                },
              ],
            };
          }

          const movedNode: Node = {
            ...nodeToMove,
            position: action.payload.position,
          };

          const result = validateNodeOperation(movedNode, "move", currentState.nodes, currentState.connections);

          violations.push(...result.violations);
          return { allowed: !result.isBlocking, violations };
        }

        case "ADD_CONNECTION": {
          let fromNode: Node | undefined;
          let toNode: Node | undefined;

          if (getNodePorts) {
            // Use port resolver if available
            fromNode = currentState.nodes[action.payload.connection.fromNodeId];
            toNode = currentState.nodes[action.payload.connection.toNodeId];

            // Verify ports exist
            if (fromNode) {
              const fromPorts = getNodePorts(fromNode.id);
              if (!fromPorts.some((port) => port.id === action.payload.connection.fromPortId)) {
                fromNode = undefined;
              }
            }
            if (toNode) {
              const toPorts = getNodePorts(toNode.id);
              if (!toPorts.some((port) => port.id === action.payload.connection.toPortId)) {
                toNode = undefined;
              }
            }
          } else {
            // Fall back to legacy method
            fromNode = Object.values(currentState.nodes).find((node) =>
              node._ports?.some((port) => port.id === action.payload.connection.fromPortId),
            );
            toNode = Object.values(currentState.nodes).find((node) =>
              node._ports?.some((port) => port.id === action.payload.connection.toPortId),
            );
          }

          if (!fromNode || !toNode) {
            return {
              allowed: false,
              violations: [
                {
                  type: "invalid-connection",
                  message: "Source or target node not found",
                  severity: "error",
                },
              ],
            };
          }

          const result = validateConnectionOperation(
            fromNode,
            toNode,
            "connect",
            currentState.nodes,
            currentState.connections,
          );

          violations.push(...result.violations);
          return { allowed: !result.isBlocking, violations };
        }

        default:
          return { allowed: true, violations: [] };
      }
    },
    [validateNodeOperation, validateConnectionOperation, getNodePorts],
  );

  return {
    validateNodeOperation,
    validateConnectionOperation,
    canPerformAction,
  };
};
