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
import { getMaterialPreset } from "./materialConfig";

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
    "wireframe-node": {
      id: "wireframe-node",
      type: "wireframe-control",
      position: { x: 120, y: 660 },
      size: { width: 220, height: 200 },
      data: {
        title: "Wireframe Pulse",
        description: "Ignite the neon lattice to outline the form.",
        wireframe: true,
      },
    },
    "material-node": {
      id: "material-node",
      type: "material-control",
      position: { x: 120, y: 900 },
      size: { width: 260, height: 360 },
      data: {
        title: "Material Composer",
        material: getMaterialPreset("hologram"),
      },
    },
    "three-node": {
      id: "three-node",
      type: "three-preview",
      position: { x: 460, y: 360 },
      size: { width: 360, height: 380 },
      data: {
        title: "Three.js Preview",
        color: "#60a5fa",
        scale: 1.5,
        background: "space",
        wireframe: false,
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
    "wireframe-to-three": {
      id: "wireframe-to-three",
      fromNodeId: "wireframe-node",
      fromPortId: "wireframe",
      toNodeId: "three-node",
      toPortId: "wireframe",
    },
    "material-to-three": {
      id: "material-to-three",
      fromNodeId: "material-node",
      fromPortId: "material",
      toNodeId: "three-node",
      toPortId: "material",
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
