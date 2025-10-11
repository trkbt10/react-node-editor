import type { NodeDefinition } from "../types/NodeDefinition";
import { ConstraintFactory } from "../utils/constraintUtils";

/**
 * Input-only node that cannot have output connections
 */
export const InputOnlyNodeDefinition: NodeDefinition = {
  type: "input-only",
  displayName: "Input Only Node",
  description: "A data source node that only provides output",
  category: "Sources",
  defaultData: {
    title: "Data Source",
    value: "",
  },
  defaultSize: { width: 150, height: 80 },
  ports: [
    {
      id: "output",
      type: "output",
      label: "Data",
      position: "right",
    },
  ],
  constraints: [
    ConstraintFactory.requiredDataFields(["value"]),
  ],
};

/**
 * Sink node that can only receive input (no output)
 */
export const SinkNodeDefinition: NodeDefinition = {
  type: "sink",
  displayName: "Sink Node",
  description: "A final destination node that only accepts input",
  category: "Sinks",
  defaultData: {
    title: "Data Sink",
  },
  defaultSize: { width: 150, height: 80 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Data",
      position: "left",
    },
  ],
  constraints: [
    ConstraintFactory.requiresInput(),
    ConstraintFactory.maxInputConnections(1),
  ],
};

/**
 * Processor node with limited inputs and placement constraints
 */
export const ConstrainedProcessorDefinition: NodeDefinition = {
  type: "constrained-processor", 
  displayName: "Constrained Processor",
  description: "A processor with input limits and placement constraints",
  category: "Processing",
  defaultData: {
    title: "Processor",
    algorithm: "",
  },
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "input1",
      type: "input",
      label: "Primary",
      position: "left",
    },
    {
      id: "input2",
      type: "input", 
      label: "Secondary",
      position: "left",
    },
    {
      id: "output",
      type: "output",
      label: "Result",
      position: "right",
    },
  ],
  constraints: [
    ConstraintFactory.maxInputConnections(2),
    ConstraintFactory.requiredDataFields(["algorithm"]),
    ConstraintFactory.boundedPlacement({ x: 0, y: 0, width: 1000, height: 800 }),
    ConstraintFactory.preventConnectionToTypes(["sink"]),
  ],
};

/**
 * Critical node that cannot be deleted easily
 */
export const CriticalNodeDefinition: NodeDefinition = {
  type: "critical",
  displayName: "Critical Node", 
  description: "A critical system node with strict constraints",
  category: "System",
  defaultData: {
    title: "Critical System",
    systemId: "",
  },
  defaultSize: { width: 200, height: 120 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "System Input",
      position: "left",
    },
    {
      id: "output",
      type: "output",
      label: "System Output", 
      position: "right",
    },
  ],
  constraints: [
    ConstraintFactory.requiredDataFields(["systemId"]),
    {
      id: "prevent-deletion",
      name: "Prevent Deletion",
      description: "Critical nodes cannot be deleted",
      blocking: true,
      appliesTo: ["delete"],
      validate: () => ({
        isValid: false,
        violations: [{
          type: "prevent-deletion",
          message: "Critical nodes cannot be deleted for safety reasons",
          severity: "error" as const,
        }],
      }),
    },
    {
      id: "require-confirmation",
      name: "Require Confirmation",
      description: "Changes to critical nodes require confirmation",
      blocking: false,
      appliesTo: ["update"],
      validate: (context) => {
        const hasConfirmation = context.context?.confirmed === true;
        if (!hasConfirmation) {
          return {
            isValid: false,
            violations: [{
              type: "require-confirmation",
              message: "Changes to critical nodes require confirmation",
              severity: "warning" as const,
            }],
          };
        }
        return { isValid: true, violations: [] };
      },
    },
  ],
};

/**
 * Aggregator node that requires multiple inputs
 */
export const AggregatorNodeDefinition: NodeDefinition = {
  type: "aggregator",
  displayName: "Aggregator Node",
  description: "Aggregates multiple data inputs into one output",
  category: "Processing",
  defaultData: {
    title: "Aggregator",
    operation: "sum",
  },
  defaultSize: { width: 160, height: 140 },
  ports: [
    {
      id: "input1",
      type: "input",
      label: "Value 1",
      position: "left",
    },
    {
      id: "input2",
      type: "input",
      label: "Value 2",
      position: "left",
    },
    {
      id: "input3",
      type: "input",
      label: "Value 3",
      position: "left",
    },
    {
      id: "output",
      type: "output",
      label: "Result",
      position: "right",
    },
  ],
  constraints: [
    ConstraintFactory.requiredDataFields(["operation"]),
    {
      id: "minimum-inputs",
      name: "Minimum Input Connections",
      description: "Aggregator requires at least 2 input connections",
      blocking: false,
      appliesTo: ["connect", "disconnect"],
      validate: (context) => {
        const inputConnections = Object.values(context.allConnections).filter(
          conn => conn.toNodeId === context.node.id
        );

        if (inputConnections.length < 2) {
          return {
            isValid: false,
            violations: [{
              type: "minimum-inputs",
              message: "Aggregator requires at least 2 input connections to function properly",
              severity: "warning" as const,
              nodeIds: [context.node.id],
            }],
          };
        }

        return { isValid: true, violations: [] };
      },
    },
  ],
};