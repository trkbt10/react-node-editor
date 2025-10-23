# react-wireflow

React components for building node-based workflow editors with TypeScript support.

[![npm version](https://img.shields.io/npm/v/react-wireflow?logo=npm&label=react-wireflow)](https://www.npmjs.com/package/react-wireflow)
[![npm downloads](https://img.shields.io/npm/dm/react-wireflow?color=cb3837)](https://www.npmjs.com/package/react-wireflow)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-wireflow?logo=rollup&label=min%2Bgzip)](https://bundlephobia.com/package/react-wireflow)
[![status](https://img.shields.io/badge/status-experimental-f97316.svg)](#)

Demo: https://trkbt10.github.io/react-node-editor/

Type-safe node definitions, customizable renderers, grid-based layouts, settings persistence, undo/redo, i18n.

## Installation

```bash
npm install react-wireflow
```

```tsx
import "react-wireflow/style.css";
```

## Usage

```tsx
import { NodeEditor, createNodeDefinition } from "react-wireflow";

const MyNode = createNodeDefinition({
  type: "my-node",
  displayName: "My Node",
  ports: [
    { id: "in", type: "input", position: "left" },
    { id: "out", type: "output", position: "right" },
  ],
});

function App() {
  const [data, setData] = useState({ nodes: {}, connections: {} });
  return <NodeEditor data={data} onDataChange={setData} nodeDefinitions={[MyNode]} />;
}
```

## Panels

Use `defaultEditorGridLayers` for built-in panels (canvas, inspector, statusbar):

```tsx
import { defaultEditorGridConfig, defaultEditorGridLayers } from "react-wireflow";

<NodeEditor gridConfig={defaultEditorGridConfig} gridLayers={defaultEditorGridLayers} />
```

Or define custom layouts:

```tsx
<NodeEditor
  gridConfig={{
    areas: [["canvas", "inspector"]],
    rows: [{ size: "1fr" }],
    columns: [{ size: "1fr" }, { size: "300px", resizable: true }],
  }}
  gridLayers={[
    { id: "canvas", component: <NodeCanvas />, gridArea: "canvas" },
    { id: "inspector", component: <InspectorPanel />, gridArea: "inspector" },
  ]}
/>
```

Add floating layers:

```tsx
const layers = [
  ...defaultEditorGridLayers,
  {
    id: "minimap",
    component: <YourMinimap />,
    positionMode: "absolute",
    position: { right: 10, bottom: 10 },
    draggable: true,
  },
];
```

Drawer for mobile:

```tsx
{ id: "panel", component: <MyPanel />, drawer: { placement: "right", open: isOpen } }
```

See [examples](https://github.com/trkbt10/react-node-editor/tree/main/src/examples/demos) for complete implementations.
