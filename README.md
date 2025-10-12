# Node Editor

## Overview

Node Editor is a React-based component for building node editors. It bundles node and connection rendering, an inspector, a status bar, and more into a single `NodeEditor`.

Demo: https://trkbt10.github.io/react-node-editor/

## Basic Usage

Pass graph data and callbacks to `NodeEditor`, and it will render the canvas along with the accompanying panels. The following example shows how to use the controlled mode.

```tsx
import { useState } from "react";
import {
  NodeEditor,
  type NodeEditorData,
  createNodeDefinition,
  defaultEditorGridConfig,
  defaultEditorGridLayers,
  SettingsManager,
  LocalSettingsStorage,
} from "node-editor";

const settingsManager = new SettingsManager(new LocalSettingsStorage("example"));

const initialData: NodeEditorData = {
  nodes: {},
  connections: {},
};

const CustomDefinition = createNodeDefinition({
  type: "example",
  displayName: "Example Node",
  category: "Samples",
  defaultData: { title: "Example" },
  ports: [
    { id: "in", type: "input", label: "In", position: "left" },
    { id: "out", type: "output", label: "Out", position: "right" },
  ],
});

export function App() {
  const [data, setData] = useState<NodeEditorData>(initialData);

  return (
    <NodeEditor
      data={data}
      onDataChange={setData}
      nodeDefinitions={[CustomDefinition]}
      includeDefaultDefinitions={true}
      settingsManager={settingsManager}
      gridConfig={defaultEditorGridConfig}
      gridLayers={defaultEditorGridLayers}
    />
  );
}
```
