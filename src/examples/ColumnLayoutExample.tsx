import * as React from "react";
import { NodeEditor, InspectorPanel, NodeCanvas, StatusBar, type GridLayoutConfig, type LayerDefinition } from "../index";

// Example: Default layout (canvas + inspector)
export const DefaultLayoutExample: React.FC = () => {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      {/* No gridConfig/gridLayers specified - uses default canvas + inspector (300px, resizable) */}
      <NodeEditor />
    </div>
  );
};

// Example: Custom inspector width (wider, resizable)
export const CustomInspectorWidthExample: React.FC = () => {
  const gridConfig: GridLayoutConfig = {
    areas: [["canvas", "inspector"]],
    rows: [{ size: "1fr" }],
    columns: [
      { size: "1fr" },
      { size: "400px", resizable: true, minSize: 300, maxSize: 600 }, // Wider resizable inspector
    ],
    gap: "0",
  };

  const gridLayers: LayerDefinition[] = [
    {
      id: "canvas",
      component: <NodeCanvas />,
      gridArea: "canvas",
    },
    {
      id: "inspector",
      component: <InspectorPanel />,
      gridArea: "inspector",
    },
  ];

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <NodeEditor gridConfig={gridConfig} gridLayers={gridLayers} />
    </div>
  );
};

// Example: Canvas only (no inspector)
export const CanvasOnlyExample: React.FC = () => {
  const gridConfig: GridLayoutConfig = {
    areas: [["canvas"]],
    rows: [{ size: "1fr" }],
    columns: [{ size: "1fr" }],
    gap: "0",
  };

  const gridLayers: LayerDefinition[] = [
    {
      id: "canvas",
      component: <NodeCanvas />,
      gridArea: "canvas",
    },
  ];

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <NodeEditor gridConfig={gridConfig} gridLayers={gridLayers} />
    </div>
  );
};

// Example: With custom toolbar
export const WithToolbarExample: React.FC = () => {
  const toolbar = (
    <div style={{ padding: "8px 16px", background: "var(--color-bg-secondary, #f5f5f5)", borderBottom: "1px solid var(--color-border, #ddd)" }}>
      <button>New</button>
      <button>Save</button>
      <button>Export</button>
    </div>
  );

  const gridConfig: GridLayoutConfig = {
    areas: [
      ["toolbar", "toolbar"],
      ["canvas", "inspector"],
    ],
    rows: [{ size: "auto" }, { size: "1fr" }],
    columns: [
      { size: "1fr" },
      { size: "300px", resizable: true, minSize: 200, maxSize: 500 },
    ],
    gap: "0",
  };

  const gridLayers: LayerDefinition[] = [
    {
      id: "toolbar",
      component: toolbar,
      gridArea: "toolbar",
      zIndex: 2,
    },
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
  ];

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <NodeEditor gridConfig={gridConfig} gridLayers={gridLayers} />
    </div>
  );
};