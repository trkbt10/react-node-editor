import type {
  NodeConstraint,
  ConstraintContext,
  ConstraintValidationResult,
  ConstraintViolation,
  NodeDefinition,
} from "../../../types/NodeDefinition";
import type { Node, NodeId, Connection } from "../../../types/core";

/**
 * Validate all constraints for a node
 */
export function validateNodeConstraints(
  node: Node,
  nodeDefinition: NodeDefinition,
  allNodes: Record<NodeId, Node>,
  allConnections: Record<string, Connection>,
  operation: ConstraintContext["operation"],
  context?: Record<string, unknown>,
): ConstraintValidationResult {
  const violations: ConstraintViolation[] = [];

  if (!nodeDefinition.constraints || nodeDefinition.constraints.length === 0) {
    return { isValid: true, violations: [] };
  }

  const constraintContext: ConstraintContext = {
    node,
    allNodes,
    allConnections,
    nodeDefinition,
    operation,
    context,
  };

  for (const constraint of nodeDefinition.constraints) {
    // Check if constraint applies to this operation
    if (constraint.appliesTo && !constraint.appliesTo.includes(operation)) {
      continue;
    }

    try {
      const result = constraint.validate(constraintContext);
      if (!result.isValid) {
        violations.push(...result.violations);
      }
    } catch (error) {
      // Handle constraint validation errors
      violations.push({
        type: "constraint-error",
        message: `Constraint validation failed: ${constraint.name} - ${error}`,
        severity: "error",
        nodeIds: [node.id],
      });
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Validate constraints for a connection operation
 */
export function validateConnectionConstraints(
  fromNode: Node,
  toNode: Node,
  fromNodeDefinition: NodeDefinition,
  toNodeDefinition: NodeDefinition,
  allNodes: Record<NodeId, Node>,
  allConnections: Record<string, Connection>,
  operation: "connect" | "disconnect",
  context?: Record<string, unknown>,
): ConstraintValidationResult {
  const violations: ConstraintViolation[] = [];

  // Validate constraints for both nodes
  const fromResult = validateNodeConstraints(fromNode, fromNodeDefinition, allNodes, allConnections, operation, {
    ...context,
    targetNode: toNode,
  });

  const toResult = validateNodeConstraints(toNode, toNodeDefinition, allNodes, allConnections, operation, {
    ...context,
    sourceNode: fromNode,
  });

  violations.push(...fromResult.violations, ...toResult.violations);

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Check if any constraints are blocking
 */
export function hasBlockingViolations(violations: ConstraintViolation[], constraints: NodeConstraint[]): boolean {
  return violations.some((violation) => {
    const constraint = constraints.find((c) => c.id === violation.type);
    return constraint?.blocking === true || violation.severity === "error";
  });
}
