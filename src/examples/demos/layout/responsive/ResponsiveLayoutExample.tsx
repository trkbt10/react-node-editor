/**
 * @file Responsive layout example with mobile/desktop switching
 * Demonstrates dynamic layout switching based on viewport size
 */
import * as React from "react";
import { NodeEditor, type GridLayoutConfig, type LayerDefinition } from "../../../../index";
import { InspectorPanel } from "../../../../components/inspector/InspectorPanel";
import { NodeCanvas } from "../../../../components/canvas/NodeCanvas";
import { Minimap } from "../../../../components/layers/Minimap";
import { GridToolbox } from "../../../../components/layers/GridToolbox";
import { StandardNodeDefinition } from "../../../../node-definitions/standard";
import { toUntypedDefinition } from "../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../types/core";
import { getViewportWidth } from "../../../../utils/mobileDetection";

const initialData: NodeEditorData = {
  nodes: {
    "node-1": {
      id: "node-1",
      type: "standard",
      position: { x: 100, y: 100 },
      size: { width: 180, height: 120 },
      data: { title: "Start Node", content: "" },
    },
    "node-2": {
      id: "node-2",
      type: "standard",
      position: { x: 400, y: 100 },
      size: { width: 180, height: 120 },
      data: { title: "Process Node", content: "" },
    },
    "node-3": {
      id: "node-3",
      type: "standard",
      position: { x: 700, y: 100 },
      size: { width: 180, height: 120 },
      data: { title: "End Node", content: "" },
    },
    "node-4": {
      id: "node-4",
      type: "standard",
      position: { x: 250, y: 300 },
      size: { width: 180, height: 120 },
      data: { title: "Branch A", content: "" },
    },
    "node-5": {
      id: "node-5",
      type: "standard",
      position: { x: 550, y: 300 },
      size: { width: 180, height: 120 },
      data: { title: "Branch B", content: "" },
    },
  },
  connections: {
    "conn-1": {
      id: "conn-1",
      fromNodeId: "node-1",
      fromPortId: "output",
      toNodeId: "node-2",
      toPortId: "input",
    },
    "conn-2": {
      id: "conn-2",
      fromNodeId: "node-2",
      fromPortId: "output",
      toNodeId: "node-3",
      toPortId: "input",
    },
  },
};

/**
 * Layout mode indicator component
 */
const LayoutModeIndicator: React.FC<{
  mode: "mobile" | "tablet" | "desktop";
  width: number;
  onToggleInspector?: () => void;
  onToggleMinimap?: () => void;
  showInspector: boolean;
  showMinimap: boolean;
}> = ({ mode, width, onToggleInspector, onToggleMinimap, showInspector, showMinimap }) => {
  const modeColors = {
    mobile: "#ff6b6b",
    tablet: "#ffa94d",
    desktop: "#51cf66",
  };

  const modeLabels = {
    mobile: "📱 Mobile",
    tablet: "💻 Tablet",
    desktop: "🖥️ Desktop",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        padding: "12px 16px",
        background: "var(--node-editor-bg, #fff)",
        border: `2px solid ${modeColors[mode]}`,
        borderRadius: "var(--node-editor-radius-md, 8px)",
        fontSize: "14px",
        zIndex: 2000,
        boxShadow: "var(--node-editor-shadow-lg, 0 4px 8px rgba(0, 0, 0, 0.15))",
        minWidth: "200px",
      }}
    >
      <div style={{ marginBottom: "8px", fontWeight: "bold", color: modeColors[mode] }}>
        {modeLabels[mode]}
      </div>
      <div style={{ fontSize: "12px", color: "var(--node-editor-text-secondary, #666)", marginBottom: "8px" }}>
        Width: {width}px
      </div>
      {mode !== "desktop" && onToggleInspector && (
        <button
          onClick={onToggleInspector}
          style={{
            width: "100%",
            padding: "6px 12px",
            marginBottom: "4px",
            background: showInspector ? modeColors[mode] : "var(--node-editor-bg-secondary, #f5f5f5)",
            color: showInspector ? "#fff" : "var(--node-editor-text, #000)",
            border: "none",
            borderRadius: "var(--node-editor-radius-sm, 4px)",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          {showInspector ? "Hide" : "Show"} Inspector
        </button>
      )}
      {mode !== "mobile" && onToggleMinimap && (
        <button
          onClick={onToggleMinimap}
          style={{
            width: "100%",
            padding: "6px 12px",
            background: showMinimap ? modeColors[mode] : "var(--node-editor-bg-secondary, #f5f5f5)",
            color: showMinimap ? "#fff" : "var(--node-editor-text, #000)",
            border: "none",
            borderRadius: "var(--node-editor-radius-sm, 4px)",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          {showMinimap ? "Hide" : "Show"} Minimap
        </button>
      )}
    </div>
  );
};

/**
 * Get layout mode based on viewport width
 */
const getLayoutMode = (width: number): "mobile" | "tablet" | "desktop" => {
  if (width < 768) {
    return "mobile";
  }
  if (width < 1024) {
    return "tablet";
  }
  return "desktop";
};

/**
 * Responsive layout example
 * Dynamically switches between mobile, tablet, and desktop layouts
 */
export const ResponsiveLayoutExample: React.FC = () => {
  const [viewportWidth, setViewportWidth] = React.useState(() => getViewportWidth());
  const [showInspector, setShowInspector] = React.useState(false);
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [layoutKey, setLayoutKey] = React.useState(0);

  // Update viewport width on resize
  React.useEffect(() => {
    const handleResize = () => {
      setViewportWidth(getViewportWidth());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const layoutMode = React.useMemo(() => getLayoutMode(viewportWidth), [viewportWidth]);

  const handleToggleInspector = React.useCallback(() => {
    setShowInspector((prev) => !prev);
    setLayoutKey((prev) => prev + 1);
  }, []);

  const handleToggleMinimap = React.useCallback(() => {
    setShowMinimap((prev) => !prev);
  }, []);

  const handleInspectorStateChange = React.useCallback((open: boolean) => {
    setShowInspector(open);
  }, []);

  // Desktop layout: Traditional 3-column grid with resizable inspector
  const desktopGridConfig = React.useMemo<GridLayoutConfig>(
    () => ({
      areas: [["canvas", "canvas", "inspector"]],
      rows: [{ size: "1fr" }],
      columns: [{ size: "1fr" }, { size: "1fr" }, { size: "320px", resizable: true, minSize: 280, maxSize: 500 }],
      gap: "0",
    }),
    [],
  );

  const desktopLayers = React.useMemo<LayerDefinition[]>(
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
        zIndex: 10,
      },
      {
        id: "minimap",
        component: showMinimap ? <Minimap width={200} height={150} /> : null,
        positionMode: "absolute",
        position: { right: 340, bottom: 20 },
        zIndex: 100,
        width: 200,
        height: 150,
        draggable: true,
      },
      {
        id: "toolbar",
        component: <GridToolbox />,
        positionMode: "fixed",
        position: { bottom: 20, left: "50%" },
        style: { transform: "translateX(-50%)" },
        zIndex: 200,
      },
    ],
    [showMinimap],
  );

  // Tablet layout: Full-width canvas with floating inspector
  const tabletGridConfig = React.useMemo<GridLayoutConfig>(
    () => ({
      areas: [["canvas"]],
      rows: [{ size: "1fr" }],
      columns: [{ size: "1fr" }],
      gap: "0",
    }),
    [],
  );

  const tabletLayers = React.useMemo<LayerDefinition[]>(
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
        positionMode: "absolute",
        position: { right: 20, top: 80 },
        width: 300,
        height: "calc(100% - 100px)",
        zIndex: 100,
        draggable: true,
        pointerEvents: "auto",
        visible: showInspector,
      },
      {
        id: "minimap",
        component: showMinimap ? <Minimap width={180} height={120} /> : null,
        positionMode: "absolute",
        position: { left: 20, bottom: 20 },
        zIndex: 100,
        width: 180,
        height: 120,
        draggable: true,
      },
      {
        id: "toolbar",
        component: <GridToolbox />,
        positionMode: "fixed",
        position: { bottom: 20, left: "50%" },
        style: { transform: "translateX(-50%)" },
        zIndex: 200,
      },
    ],
    [showInspector, showMinimap],
  );

  // Mobile layout: Full-width canvas with drawer-based inspector
  const mobileGridConfig = React.useMemo<GridLayoutConfig>(
    () => ({
      areas: [["canvas"]],
      rows: [{ size: "1fr" }],
      columns: [{ size: "1fr" }],
      gap: "0",
    }),
    [],
  );

  const mobileLayers = React.useMemo<LayerDefinition[]>(
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
        drawer: {
          placement: "bottom",
          defaultOpen: showInspector,
          dismissible: true,
          showBackdrop: true,
          backdropOpacity: 0.4,
          size: "70%",
          onStateChange: handleInspectorStateChange,
        },
      },
      {
        id: "toolbar",
        component: <GridToolbox />,
        positionMode: "fixed",
        position: { bottom: 20, left: "50%" },
        style: { transform: "translateX(-50%)" },
        zIndex: 200,
      },
    ],
    [showInspector, handleInspectorStateChange],
  );

  // Select grid config and layers based on layout mode
  const { gridConfig, gridLayers } = React.useMemo(() => {
    switch (layoutMode) {
      case "mobile":
        return { gridConfig: mobileGridConfig, gridLayers: mobileLayers };
      case "tablet":
        return { gridConfig: tabletGridConfig, gridLayers: tabletLayers };
      case "desktop":
        return { gridConfig: desktopGridConfig, gridLayers: desktopLayers };
    }
  }, [layoutMode, mobileGridConfig, mobileLayers, tabletGridConfig, tabletLayers, desktopGridConfig, desktopLayers]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <NodeEditor
        key={layoutKey}
        gridConfig={gridConfig}
        gridLayers={gridLayers}
        initialData={initialData}
        nodeDefinitions={[toUntypedDefinition(StandardNodeDefinition)]}
      />

      <LayoutModeIndicator
        mode={layoutMode}
        width={viewportWidth}
        onToggleInspector={layoutMode !== "desktop" ? handleToggleInspector : undefined}
        onToggleMinimap={layoutMode !== "mobile" ? handleToggleMinimap : undefined}
        showInspector={showInspector}
        showMinimap={showMinimap}
      />
    </div>
  );
};
