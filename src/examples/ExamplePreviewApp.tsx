/**
 * @file Shell UI that lets developers switch between example scenarios
 */
import * as React from "react";

import CustomNodeExample from "./demos/CustomNodeExample";
import { ConstrainedNodeExample } from "./demos/ConstrainedNodeExample";
import { TypedNodesExample } from "./demos/TypedNodesExample";
import classes from "./ExamplePreviewApp.module.css";

type ExampleEntry = {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
};

const examples: ExampleEntry[] = [
  {
    id: "custom-node",
    title: "Custom Nodes with External Data",
    description: "Shows how to connect custom renderers to external data sources.",
    component: CustomNodeExample,
  },
  {
    id: "typed-nodes",
    title: "Typed Node Definitions",
    description: "Demonstrates strongly-typed node definitions with custom renderers.",
    component: TypedNodesExample,
  },
  {
    id: "constrained-nodes",
    title: "Constrained Node Definitions",
    description: "Highlights constraint helpers for placement and connection rules.",
    component: ConstrainedNodeExample,
  },
];

if (examples.length === 0) {
  throw new Error("No examples are configured for the preview app.");
}

/**
 * Renders the preview shell with example selection controls.
 */
export function ExamplePreviewApp(): React.ReactElement {
  const [selectedExampleId, setSelectedExampleId] = React.useState(examples[0].id);

  const selectedExample = React.useMemo(
    () => examples.find((example) => example.id === selectedExampleId) ?? examples[0],
    [selectedExampleId],
  );

  const ExampleComponent = selectedExample.component;

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <div className={classes.headerContent}>
          <h1 className={classes.title}>Node Editor Examples</h1>
          <span className={classes.description}>{selectedExample.description}</span>
        </div>
        <select
          aria-label="Select example"
          value={selectedExampleId}
          onChange={(event) => setSelectedExampleId(event.target.value)}
          className={classes.select}
        >
          {examples.map((example) => (
            <option key={example.id} value={example.id}>
              {example.title}
            </option>
          ))}
        </select>
      </header>
      <main className={classes.main}>
        <ExampleComponent />
      </main>
    </div>
  );
}
