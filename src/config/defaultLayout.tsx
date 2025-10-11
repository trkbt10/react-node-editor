import React from "react";
import { NodeCanvas } from "../components/canvas/NodeCanvas";
import { InspectorPanel } from "../components/inspector/InspectorPanel";
import { StatusBar } from "../components/layout/StatusBar";
import { GridLayoutConfig, LayerDefinition } from "../types/panels";
/**
 * Default grid layout configuration for node editor
 * Provides a 2-column layout: canvas (1fr) + inspector (300px, resizable)
 */
export const defaultEditorGridConfig: GridLayoutConfig = {
  areas: [
    ["canvas", "inspector"],
    ["statusbar", "statusbar"],
  ],
  rows: [{ size: "1fr" }, { size: "auto" }],
  columns: [{ size: "1fr" }, { size: "300px", resizable: true, minSize: 200, maxSize: 600 }],
  gap: "0",
};
export const defaultEditorGridLayers: LayerDefinition[] = [
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
];
