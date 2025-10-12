/**
 * @file Example demonstrating Three.js integration with custom node rendering
 */
import * as React from "react";
import { NodeEditor, type GridLayoutConfig, type LayerDefinition } from "../../../index";
import type { NodeEditorData } from "../../../types/core";
import { NodeCanvas } from "../../../components/canvas/NodeCanvas";
import { InspectorPanel } from "../../../components/inspector/InspectorPanel";
import { StatusBar } from "../../../components/layout/StatusBar";
import { Minimap } from "../../../components/layers/Minimap";
import { createThreeJsNodeDefinitions } from "./createThreeJsNodeDefinitions";

const initialData: NodeEditorData = {
  nodes: {
    "color-node": {
      id: "color-node",
      type: "color-control",
      position: { x: 120, y: 180 },
      size: { width: 220, height: 180 },
      data: {
        title: "Object Color",
        color: "#60a5fa",
      },
    },
    "scale-node": {
      id: "scale-node",
      type: "scale-control",
      position: { x: 120, y: 420 },
      size: { width: 220, height: 180 },
      data: {
        title: "Object Scale",
        value: 1.5,
        min: 0.5,
        max: 3,
        step: 0.1,
      },
    },
    "three-node": {
      id: "three-node",
      type: "three-preview",
      position: { x: 440, y: 260 },
      size: { width: 360, height: 380 },
      data: {
        title: "Three.js Preview",
        color: "#60a5fa",
        scale: 1.5,
        background: "space",
      },
    },
  },
  connections: {
    "color-to-three": {
      id: "color-to-three",
      fromNodeId: "color-node",
      fromPortId: "color",
      toNodeId: "three-node",
      toPortId: "color",
    },
    "scale-to-three": {
      id: "scale-to-three",
      fromNodeId: "scale-node",
      fromPortId: "value",
      toNodeId: "three-node",
      toPortId: "scale",
    },
  },
};

/**
 * Example demonstrating how to integrate Three.js rendering inside a custom node.
 */
export const ThreeJsExample: React.FC = () => {
  const nodeDefinitions = React.useMemo(() => createThreeJsNodeDefinitions(), []);

  const gridConfig = React.useMemo<GridLayoutConfig>(
    () => ({
      areas: [
        ["canvas", "inspector"],
        ["statusbar", "statusbar"],
      ],
      rows: [{ size: "1fr" }, { size: "auto" }],
      columns: [{ size: "1fr" }, { size: "320px", resizable: true, minSize: 220, maxSize: 520 }],
      gap: "0",
    }),
    [],
  );

  const gridLayers = React.useMemo<LayerDefinition[]>(
    () => [
      {
        id: "canvas",
        component: <NodeCanvas />,
        gridArea: "canvas",
        zIndex: 0,
      },
      {
        id: "inspector",
        component: <InspectorPanel />,
        gridArea: "inspector",
        zIndex: 1,
      },
      {
        id: "statusbar",
        component: <StatusBar />,
        gridArea: "statusbar",
        zIndex: 1,
      },
      {
        id: "minimap",
        component: <Minimap width={200} height={140} />,
        positionMode: "absolute",
        position: { bottom: 10, right: 10 },
        width: 200,
        height: 140,
        zIndex: 100,
        traggable: true,
      },
    ],
    [],
  );

  return (
    <NodeEditor
      initialData={initialData}
      nodeDefinitions={nodeDefinitions}
      includeDefaultDefinitions={true}
      gridConfig={gridConfig}
      gridLayers={gridLayers}
    />
  );
};

export default ThreeJsExample;
