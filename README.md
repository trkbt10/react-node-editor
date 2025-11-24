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

## Custom ports and connections

Declare `renderPort` per port definition to override the visual while keeping editor interactions. The second argument renders the default dot, which you can keep for accessibility hitboxes or replace entirely. Always forward `context.handlers` and honor `context.position` (x, y, transform) for correct anchoring.

```tsx
const CustomPorts = createNodeDefinition({
  type: "custom-ports",
  displayName: "Custom Ports",
  ports: [
    {
      id: "emit",
      type: "output",
      label: "Emit",
      position: "right",
      dataType: ["text", "html"],
      renderPort: (context, defaultRender) => {
        if (!context.position) return defaultRender();
        const { x, y, transform } = context.position;
        return (
          <div
            style={{ position: "absolute", left: x, top: y, transform: transform ?? "translate(-50%, -50%)" }}
            onPointerDown={context.handlers.onPointerDown}
            onPointerUp={context.handlers.onPointerUp}
            onPointerEnter={context.handlers.onPointerEnter}
            onPointerMove={context.handlers.onPointerMove}
            onPointerLeave={context.handlers.onPointerLeave}
            onPointerCancel={context.handlers.onPointerCancel}
            data-state={context.isConnectable ? "ready" : context.isHovered ? "hovered" : "idle"}
          >
            <span className="port-dot" />
            <span className="port-label">{context.port.label}</span>
          </div>
        );
      },
      renderConnection: (context, defaultRender) => {
        // Example: decorate connected lines; fall back to default during previews
        if (!context.connection) return defaultRender();
        return defaultRender();
      },
    },
  ],
});
```

`PortRenderContext` includes `port`, `node`, `allNodes`, `allConnections`, booleans (`isConnecting`, `isConnectable`, `isCandidate`, `isHovered`, `isConnected`), optional `position`, and pointer handlers you must preserve. `ConnectionRenderContext` provides `phase`, `fromPort`, `toPort`, their positions, selection/hover flags, and handlers for pointer/cxtmenu; use it to add badges or halos while keeping hit-testing intact. For dynamic ports, set `instances`, `createPortId`, and `createPortLabel` on the port definition (see `src/examples/demos/custom-port` for a complete playground).

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
