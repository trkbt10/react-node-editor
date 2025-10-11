/**
 * Example: Using the enhanced NodeRenderProps with optional generics
 * This demonstrates how to create type-safe node definitions
 */

import React from "react";
import type { NodeDataTypeMap, NodeRenderProps, InspectorRenderProps } from "../types/NodeDefinition";
import { createNodeDefinition, createNodeDataUpdater } from "../types/NodeDefinition";

// Step 1: Extend the NodeDataTypeMap interface
// NOTE: In a real application, you would declare this in a separate types file
// that is imported by your application, not in the example file.
// 
// declare module "@tanuki-ui/node-editor" {
//   interface NodeDataTypeMap {
//     "counter-node": {
//       label: string;
//       count: number;
//       step: number;
//     };
//     "text-display": {
//       title: string;
//       content: string;
//       fontSize: number;
//     };
//   }
// }

// For this example, we'll define the types directly
type CounterNodeData = {
  label: string;
  count: number;
  step: number;
};

type TextDisplayData = {
  title: string;
  content: string;
  fontSize: number;
};

// Step 2: Create type-safe node renderers (without module augmentation for this example)
const CounterNodeRenderer = ({ 
  node, 
  isSelected,
  onUpdateNode 
}: NodeRenderProps): React.ReactElement => {
  // For the example, we'll use type assertions
  const { label, count, step } = node.data as CounterNodeData;
  
  const handleIncrement = () => {
    onUpdateNode({ data: { ...node.data, count: count + step } });
  };
  
  const handleDecrement = () => {
    onUpdateNode({ data: { ...node.data, count: count - step } });
  };
  
  return (
    <div className={`node-content ${isSelected ? 'selected' : ''}`}>
      <h3>{label}</h3>
      <div className="counter-display">{count}</div>
      <div className="counter-controls">
        <button onClick={handleDecrement}>-{step}</button>
        <button onClick={handleIncrement}>+{step}</button>
      </div>
    </div>
  );
};

const CounterNodeInspector = ({ 
  node, 
  onUpdateNode 
}: InspectorRenderProps): React.ReactElement => {
  const { label, count, step } = node.data as CounterNodeData;
  
  return (
    <div className="inspector-content">
      <div className="form-group">
        <label>Label</label>
        <input 
          type="text" 
          value={label} 
          onChange={(e) => onUpdateNode({ data: { ...node.data, label: e.target.value } })}
        />
      </div>
      <div className="form-group">
        <label>Current Count</label>
        <input 
          type="number" 
          value={count} 
          onChange={(e) => onUpdateNode({ data: { ...node.data, count: Number(e.target.value) } })}
        />
      </div>
      <div className="form-group">
        <label>Step Size</label>
        <input 
          type="number" 
          value={step} 
          onChange={(e) => onUpdateNode({ data: { ...node.data, step: Number(e.target.value) } })}
        />
      </div>
    </div>
  );
};

// Step 3: Create the node definition
export const CounterNodeDefinition = createNodeDefinition({
  type: "counter-node",
  displayName: "Counter",
  description: "A node that maintains a counter",
  category: "Interactive",
  defaultData: {
    label: "Counter",
    count: 0,
    step: 1,
  },
  defaultSize: { width: 200, height: 150 },
  renderNode: CounterNodeRenderer,
  renderInspector: CounterNodeInspector,
  ports: [
    {
      id: "value",
      type: "output",
      label: "Value",
      position: "right",
    },
  ],
});

// Text Display Node
const TextDisplayRenderer = ({ 
  node, 
  isSelected 
}: NodeRenderProps): React.ReactElement => {
  const { title, content, fontSize } = node.data as TextDisplayData;
  
  return (
    <div className={`node-content ${isSelected ? 'selected' : ''}`}>
      <h4>{title}</h4>
      <p style={{ fontSize: `${fontSize}px` }}>{content}</p>
    </div>
  );
};

export const TextDisplayDefinition = createNodeDefinition({
  type: "text-display",
  displayName: "Text Display",
  description: "Displays formatted text",
  category: "Display",
  defaultData: {
    title: "Text Display",
    content: "Enter your text here...",
    fontSize: 14,
  },
  defaultSize: { width: 250, height: 120 },
  renderNode: TextDisplayRenderer,
});

// Example of using with existing non-typed nodes (backward compatibility)
const LegacyNodeRenderer = ({ node, isSelected }: NodeRenderProps): React.ReactElement => {
  // For non-typed nodes, node.data is just NodeData (Record<string, unknown>)
  const title = node.data.title as string || "Legacy Node";
  
  return (
    <div className={`node-content ${isSelected ? 'selected' : ''}`}>
      <h4>{title}</h4>
      <p>This is a legacy node without type safety</p>
    </div>
  );
};

export const LegacyNodeDefinition = createNodeDefinition({
  type: "legacy-node", // Works without type registration
  displayName: "Legacy Node",
  description: "A node without type definitions",
  category: "Legacy",
  defaultData: {
    title: "Legacy Node",
  },
  renderNode: LegacyNodeRenderer,
});