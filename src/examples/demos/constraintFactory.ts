import type {
  NodeConstraint,
  ConstraintContext,
  ConstraintValidationResult,
} from "../../types/NodeDefinition";
import type { Node } from "../../types/core";

/**
 * Pre-built constraint factories for common node constraint patterns
 */
export const ConstraintFactory = {
  /**
   * Constraint that limits the maximum number of input connections
   */
  maxInputConnections(maxConnections: number): NodeConstraint {
    return {
      id: "max-input-connections",
      name: "Maximum Input Connections",
      description: `Limits the number of input connections to ${maxConnections}`,
      blocking: true,
      appliesTo: ["connect"],
      validate: (context: ConstraintContext): ConstraintValidationResult => {
        const inputConnections = Object.values(context.allConnections).filter(
          (conn) => conn.toNodeId === context.node.id,
        );

        if (inputConnections.length >= maxConnections) {
          return {
            isValid: false,
            violations: [
              {
                type: "max-input-connections",
                message: `Node cannot have more than ${maxConnections} input connections`,
                severity: "error",
                nodeIds: [context.node.id],
                connectionIds: inputConnections.map((c) => c.id),
              },
            ],
          };
        }

        return { isValid: true, violations: [] };
      },
    };
  },

  /**
   * Constraint that requires at least one input connection
   */
  requiresInput(): NodeConstraint {
    return {
      id: "requires-input",
      name: "Requires Input Connection",
      description: "Node must have at least one input connection",
      blocking: false,
      appliesTo: ["create", "update", "disconnect"],
      validate: (context: ConstraintContext): ConstraintValidationResult => {
        const inputConnections = Object.values(context.allConnections).filter(
          (conn) => conn.toNodeId === context.node.id,
        );

        if (inputConnections.length === 0) {
          return {
            isValid: false,
            violations: [
              {
                type: "requires-input",
                message: "Node requires at least one input connection",
                severity: "warning",
                nodeIds: [context.node.id],
              },
            ],
          };
        }

        return { isValid: true, violations: [] };
      },
    };
  },

  /**
   * Constraint that prevents connections to specific node types
   */
  preventConnectionToTypes(forbiddenTypes: string[]): NodeConstraint {
    return {
      id: "prevent-connection-to-types",
      name: "Prevent Connection to Types",
      description: `Prevents connections to nodes of types: ${forbiddenTypes.join(", ")}`,
      blocking: true,
      appliesTo: ["connect"],
      validate: (context: ConstraintContext): ConstraintValidationResult => {
        const targetNode = context.context?.targetNode as Node;

        if (targetNode && forbiddenTypes.includes(targetNode.type)) {
          return {
            isValid: false,
            violations: [
              {
                type: "prevent-connection-to-types",
                message: `Cannot connect to nodes of type: ${targetNode.type}`,
                severity: "error",
                nodeIds: [context.node.id, targetNode.id],
              },
            ],
          };
        }

        return { isValid: true, violations: [] };
      },
    };
  },

  /**
   * Constraint that limits node placement within a specific area
   */
  boundedPlacement(bounds: { x: number; y: number; width: number; height: number }): NodeConstraint {
    return {
      id: "bounded-placement",
      name: "Bounded Placement",
      description: `Node must be placed within bounds: ${bounds.x},${bounds.y} ${bounds.width}x${bounds.height}`,
      blocking: true,
      appliesTo: ["create", "move"],
      validate: (context: ConstraintContext): ConstraintValidationResult => {
        const { x, y } = context.node.position;
        const nodeWidth = context.node.size?.width || 150;
        const nodeHeight = context.node.size?.height || 50;

        const isOutOfBounds =
          x < bounds.x ||
          y < bounds.y ||
          x + nodeWidth > bounds.x + bounds.width ||
          y + nodeHeight > bounds.y + bounds.height;

        if (isOutOfBounds) {
          return {
            isValid: false,
            violations: [
              {
                type: "bounded-placement",
                message: `Node must be placed within bounds (${bounds.x}, ${bounds.y}, ${bounds.width}x${bounds.height})`,
                severity: "error",
                nodeIds: [context.node.id],
              },
            ],
          };
        }

        return { isValid: true, violations: [] };
      },
    };
  },

  /**
   * Constraint that requires specific data fields
   */
  requiredDataFields(requiredFields: string[]): NodeConstraint {
    return {
      id: "required-data-fields",
      name: "Required Data Fields",
      description: `Node must have required data fields: ${requiredFields.join(", ")}`,
      blocking: false,
      appliesTo: ["create", "update"],
      validate: (context: ConstraintContext): ConstraintValidationResult => {
        const missingFields = requiredFields.filter(
          (field) =>
            !(field in context.node.data) ||
            context.node.data[field] === undefined ||
            context.node.data[field] === null ||
            context.node.data[field] === "",
        );

        if (missingFields.length > 0) {
          return {
            isValid: false,
            violations: [
              {
                type: "required-data-fields",
                message: `Missing required data fields: ${missingFields.join(", ")}`,
                severity: "warning",
                nodeIds: [context.node.id],
              },
            ],
          };
        }

        return { isValid: true, violations: [] };
      },
    };
  },
};
