/**
 * @file Example demonstrating the hierarchical NodeAddMenu component
 *
 * Right-click on the canvas to see the "Add Node" menu with nested categories.
 */
import * as React from "react";
import { NodeEditor } from "../../../../../NodeEditor";
import type { NodeDefinition } from "../../../../../types/NodeDefinition";

const nodeDefinitions: NodeDefinition[] = [
  // Math category
  { type: "math-add", displayName: "Add", category: "Math", description: "Add two numbers" },
  { type: "math-subtract", displayName: "Subtract", category: "Math", description: "Subtract two numbers" },
  { type: "math-multiply", displayName: "Multiply", category: "Math", description: "Multiply two numbers" },
  { type: "math-divide", displayName: "Divide", category: "Math", description: "Divide two numbers" },

  // Math/Trigonometry subcategory
  { type: "math-sin", displayName: "Sin", category: "Math/Trigonometry", description: "Sine function" },
  { type: "math-cos", displayName: "Cos", category: "Math/Trigonometry", description: "Cosine function" },
  { type: "math-tan", displayName: "Tan", category: "Math/Trigonometry", description: "Tangent function" },

  // Data category
  { type: "data-input", displayName: "Input", category: "Data", description: "Data input node" },
  { type: "data-output", displayName: "Output", category: "Data", description: "Data output node" },
  { type: "data-transform", displayName: "Transform", category: "Data/Transform", description: "Transform data" },
  { type: "data-filter", displayName: "Filter", category: "Data/Transform", description: "Filter data" },
  { type: "data-map", displayName: "Map", category: "Data/Transform", description: "Map data" },

  // Logic category
  { type: "logic-if", displayName: "If", category: "Logic", description: "Conditional branch" },
  { type: "logic-switch", displayName: "Switch", category: "Logic", description: "Switch statement" },
  { type: "logic-loop", displayName: "Loop", category: "Logic/Iteration", description: "Loop over items" },
  { type: "logic-while", displayName: "While", category: "Logic/Iteration", description: "While loop" },

  // Output category
  { type: "output-console", displayName: "Console", category: "Output", description: "Log to console" },
  { type: "output-file", displayName: "File", category: "Output", description: "Write to file" },
];

export const NodeAddMenuExample: React.FC = () => {
  return (
    <NodeEditor
      nodeDefinitions={nodeDefinitions}
      initialData={{ nodes: {}, connections: {} }}
    />
  );
};

export default NodeAddMenuExample;
