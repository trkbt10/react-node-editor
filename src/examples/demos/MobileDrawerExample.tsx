/**
 * @file Mobile-friendly drawer layout example
 * Demonstrates drawer behavior for mobile devices
 */
import * as React from "react";
import { NodeEditor, type GridLayoutConfig, type LayerDefinition } from "../../index";
import { InspectorPanel } from "../../components/inspector/InspectorPanel";
import { NodeCanvas } from "../../components/canvas/NodeCanvas";
import { StandardNodeDefinition } from "../../node-definitions/standard";
import { toUntypedDefinition } from "../../types/NodeDefinition";
import type { NodeEditorData } from "../../types/core";
import { isMobileDevice, isMobileViewport } from "../../utils/mobileDetection";

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
 * Drawer toggle button component
 */
const DrawerToggleButton: React.FC<{
  onClick: () => void;
  label: string;
  position: "top" | "right" | "bottom" | "left";
}> = ({ onClick, label, position }) => {
  const positionStyles: Record<string, React.CSSProperties> = {
    top: { top: 10, left: "50%", transform: "translateX(-50%)" },
    right: { top: "50%", right: 10, transform: "translateY(-50%)" },
    bottom: { bottom: 10, left: "50%", transform: "translateX(-50%)" },
    left: { top: "50%", left: 10, transform: "translateY(-50%)" },
  };

  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        zIndex: 1001,
        padding: "8px 16px",
        background: "var(--node-editor-bg, #fff)",
        border: "1px solid var(--node-editor-border, #ccc)",
        borderRadius: "var(--node-editor-radius-md, 4px)",
        cursor: "pointer",
        boxShadow: "var(--node-editor-shadow-md, 0 2px 4px rgba(0, 0, 0, 0.1))",
        ...positionStyles[position],
      }}
    >
      {label}
    </button>
  );
};

/**
 * Mobile drawer layout example
 * Uses drawer behavior for inspector panel on mobile devices
 */
export const MobileDrawerExample: React.FC = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = React.useState(false);
  const [gridKey, setGridKey] = React.useState(0);

  // Check if we're on mobile on mount and viewport changes
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice() || isMobileViewport());
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleInspectorToggle = React.useCallback(() => {
    setIsInspectorOpen((prev) => !prev);
    // Force re-render of GridLayout with new defaultOpen state
    setGridKey((prev) => prev + 1);
  }, []);

  const handleInspectorStateChange = React.useCallback((open: boolean) => {
    setIsInspectorOpen(open);
  }, []);

  // Grid configuration - full screen canvas
  const gridConfig = React.useMemo<GridLayoutConfig>(
    () => ({
      areas: [["canvas"]],
      rows: [{ size: "1fr" }],
      columns: [{ size: "1fr" }],
      gap: "0",
    }),
    [],
  );

  // Layer configuration with conditional drawer behavior
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
        // Use drawer on mobile, fixed position on desktop
        ...(isMobile
          ? {
              drawer: {
                placement: "right",
                defaultOpen: isInspectorOpen,
                dismissible: true,
                showBackdrop: true,
                backdropOpacity: 0.5,
                size: "80%",
                onStateChange: handleInspectorStateChange,
              },
            }
          : {
              positionMode: "absolute" as const,
              position: {
                right: 0,
                top: 0,
              },
              width: 320,
              height: "100%",
              zIndex: 50,
              pointerEvents: "auto" as const,
            }),
      },
    ],
    [isMobile, isInspectorOpen, handleInspectorStateChange],
  );

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <NodeEditor
        key={gridKey}
        gridConfig={gridConfig}
        gridLayers={gridLayers}
        initialData={initialData}
        nodeDefinitions={[toUntypedDefinition(StandardNodeDefinition)]}
      />

      {/* Show toggle button only on mobile */}
      {isMobile && (
        <DrawerToggleButton
          onClick={handleInspectorToggle}
          label={isInspectorOpen ? "Close Inspector" : "Open Inspector"}
          position="right"
        />
      )}

      {/* Info overlay */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          padding: "12px 16px",
          background: "var(--node-editor-bg, #fff)",
          border: "1px solid var(--node-editor-border, #ccc)",
          borderRadius: "var(--node-editor-radius-md, 4px)",
          fontSize: "14px",
          zIndex: 100,
          boxShadow: "var(--node-editor-shadow-md, 0 2px 4px rgba(0, 0, 0, 0.1))",
        }}
      >
        <strong>Mode:</strong> {isMobile ? "Mobile (Drawer)" : "Desktop (Fixed)"}
      </div>
    </div>
  );
};
