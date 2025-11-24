/**
 * @file Demonstrates uncontrolled vs controlled NodeEditor usage side-by-side.
 */
import * as React from "react";
import { NodeEditor } from "../../NodeEditor";
import type { NodeEditorData } from "../../types/core";
import { toUntypedDefinition } from "../../types/NodeDefinition";
import { StandardNodeDefinition } from "../../node-definitions/standard";
import classes from "./DataBindingModesExample.module.css";

const createBaseData = (): NodeEditorData => ({
  nodes: {
    a: {
      id: "a",
      type: "standard",
      position: { x: 80, y: 120 },
      size: { width: 200, height: 100 },
      data: { title: "Source", content: "Uncontrolled" },
    },
    b: {
      id: "b",
      type: "standard",
      position: { x: 360, y: 180 },
      size: { width: 220, height: 120 },
      data: { title: "Processor", content: "Controlled" },
    },
  },
  connections: {
    ab: {
      id: "ab",
      fromNodeId: "a",
      fromPortId: "output",
      toNodeId: "b",
      toPortId: "input",
    },
  },
});

const createControlledData = (): NodeEditorData => {
  const base = createBaseData();
  const baseNodes = base.nodes;
  return {
    ...base,
    nodes: {
      ...baseNodes,
      b: {
        ...baseNodes.b,
        data: { title: "Processor (controlled)", content: "Parent owns state" },
      },
    },
  };
};

/**
 * DataBindingModesExample - renders uncontrolled and controlled editors side-by-side for comparison.
 */
export function DataBindingModesExample(): React.ReactElement {
  const [controlledData, setControlledData] = React.useState<NodeEditorData>(createControlledData);
  const [controlledUpdates, setControlledUpdates] = React.useState(0);
  const [uncontrolledUpdates, setUncontrolledUpdates] = React.useState(0);
  const definitions = React.useMemo(() => [toUntypedDefinition(StandardNodeDefinition)], []);

  return (
    <div className={classes.wrapper}>
      <section className={classes.panel}>
        <header className={classes.header}>
          <div>
            <div className={classes.label}>Uncontrolled</div>
            <p className={classes.desc}>Uses initialData; state lives inside the editor.</p>
          </div>
          <div className={classes.counter} aria-label="Uncontrolled change count">
            Updates: {uncontrolledUpdates}
          </div>
        </header>
        <NodeEditor
          includeDefaultDefinitions={false}
          nodeDefinitions={definitions}
          initialData={createBaseData()}
          onDataChange={() => setUncontrolledUpdates((count) => count + 1)}
          className={classes.editor}
        />
      </section>

      <section className={classes.panel}>
        <header className={classes.header}>
          <div>
            <div className={classes.label}>Controlled</div>
            <p className={classes.desc}>`data`/`onDataChange` mirror React input value/onChange.</p>
          </div>
          <div className={classes.counter} aria-label="Controlled change count">
            Updates: {controlledUpdates}
          </div>
        </header>
        <NodeEditor
          includeDefaultDefinitions={false}
          nodeDefinitions={definitions}
          data={controlledData}
          onDataChange={(next) => {
            setControlledUpdates((count) => count + 1);
            setControlledData(next);
          }}
          className={classes.editor}
        />
      </section>
    </div>
  );
}
