/**
 * Example: Using the enhanced NodeRenderProps with optional generics
 * This demonstrates how to create type-safe node definitions
 */

import React from "react";
import classes from "./TypedNodesExample.module.css";
import { NodeRenderProps, InspectorRenderProps, createNodeDefinition } from "../../types/NodeDefinition";

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
const CounterNodeRenderer = ({ node, onUpdateNode }: NodeRenderProps): React.ReactElement => {
  // For the example, we'll use type assertions
  const { label, count, step } = node.data as CounterNodeData;

  const handleIncrement = () => {
    onUpdateNode({ data: { ...node.data, count: count + step } });
  };

  const handleDecrement = () => {
    onUpdateNode({ data: { ...node.data, count: count - step } });
  };

  return (
    <div className={classes.counterNode}>
      <h3 className={classes.counterHeader}>{label}</h3>
      <div className={classes.counterDisplay}>{count}</div>
      <div className={classes.counterControls}>
        <button className={classes.counterButton} onClick={handleDecrement}>
          -{step}
        </button>
        <button className={classes.counterButton} onClick={handleIncrement}>
          +{step}
        </button>
      </div>
    </div>
  );
};

const CounterNodeInspector = ({ node, onUpdateNode }: InspectorRenderProps): React.ReactElement => {
  const { label, count, step } = node.data as CounterNodeData;

  return (
    <div className={classes.inspectorContainer}>
      <div className={classes.formGroup}>
        <label className={classes.formLabel}>Label</label>
        <input
          className={classes.formInput}
          type="text"
          value={label}
          onChange={(e) => onUpdateNode({ data: { ...node.data, label: e.target.value } })}
        />
      </div>
      <div className={classes.formGroup}>
        <label className={classes.formLabel}>Current Count</label>
        <input
          className={classes.formInput}
          type="number"
          value={count}
          onChange={(e) => onUpdateNode({ data: { ...node.data, count: Number(e.target.value) } })}
        />
      </div>
      <div className={classes.formGroup}>
        <label className={classes.formLabel}>Step Size</label>
        <input
          className={classes.formInput}
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
const TextDisplayRenderer = ({ node }: NodeRenderProps): React.ReactElement => {
  const { title, content, fontSize } = node.data as TextDisplayData;

  return (
    <div className={classes.textDisplayNode}>
      <h4 className={classes.textDisplayTitle}>{title}</h4>
      <p className={classes.textDisplayContent} style={{ fontSize: `${fontSize}px` }}>
        {content}
      </p>
    </div>
  );
};

const TextDisplayInspector = ({ node, onUpdateNode }: InspectorRenderProps): React.ReactElement => {
  const { title, content, fontSize } = node.data as TextDisplayData;

  return (
    <div className={classes.inspectorContainer}>
      <div className={classes.formGroup}>
        <label className={classes.formLabel}>Title</label>
        <input
          className={classes.formInput}
          type="text"
          value={title}
          onChange={(e) => onUpdateNode({ data: { ...node.data, title: e.target.value } })}
        />
      </div>
      <div className={classes.formGroup}>
        <label className={classes.formLabel}>Content</label>
        <textarea
          className={classes.formInput}
          value={content}
          onChange={(e) => onUpdateNode({ data: { ...node.data, content: e.target.value } })}
          rows={4}
        />
      </div>
      <div className={classes.formGroup}>
        <label className={classes.formLabel}>Font Size (px)</label>
        <input
          className={classes.formInput}
          type="number"
          value={fontSize}
          min={8}
          max={32}
          onChange={(e) => onUpdateNode({ data: { ...node.data, fontSize: Number(e.target.value) } })}
        />
      </div>
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
  renderInspector: TextDisplayInspector,
  ports: [
    {
      id: "text-input",
      type: "input",
      label: "Text In",
      position: "left",
    },
  ],
});

// Example of using with existing non-typed nodes (backward compatibility)
const LegacyNodeRenderer = ({ node }: NodeRenderProps): React.ReactElement => {
  // For non-typed nodes, node.data is just NodeData (Record<string, unknown>)
  const title = (node.data.title as string) || "Legacy Node";

  return (
    <div className={classes.legacyNode}>
      <h4 className={classes.legacyTitle}>{title}</h4>
      <p className={classes.legacyDescription}>This is a legacy node without type safety</p>
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
