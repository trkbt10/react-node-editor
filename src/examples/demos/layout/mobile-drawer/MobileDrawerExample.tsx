/**
 * @file Mobile-friendly drawer layout example
 * Demonstrates drawer behavior for mobile devices
 */
import * as React from "react";
import { NodeEditor, type GridLayoutConfig, type LayerDefinition } from "../../../../index";
import { InspectorPanel } from "../../../../components/inspector/InspectorPanel";
import { NodeCanvas } from "../../../../components/canvas/NodeCanvas";
import { StandardNodeDefinition } from "../../../../node-definitions/standard";
import { asNodeDefinition } from "../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../types/core";
import { isMobileDevice, isMobileViewport } from "../../../../utils/mobileDetection";
import { useEditorActionState } from "../../../../contexts/composed/EditorActionStateContext";

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
 * Inspector wrapper that monitors node selection and triggers drawer open
 */
type InspectorWithDrawerControlProps = {
  onNodeSelect: (hasSelection: boolean) => void;
  shouldResetSelection: boolean;
  onSelectionResetComplete: () => void;
};

const InspectorWithDrawerControl: React.FC<InspectorWithDrawerControlProps> = ({
  onNodeSelect,
  shouldResetSelection,
  onSelectionResetComplete,
}) => {
  const { state: editorActionState, actions: actionActions } = useEditorActionState();

  const hasSelectedNode = React.useMemo(() => {
    return editorActionState.editingSelectedNodeIds.length > 0;
  }, [editorActionState.editingSelectedNodeIds]);

  React.useEffect(() => {
    onNodeSelect(hasSelectedNode);
  }, [hasSelectedNode, onNodeSelect]);

  React.useEffect(() => {
    if (!shouldResetSelection) {
      return;
    }
    actionActions.clearInteractionSelection();
    actionActions.clearEditingSelection();
    onSelectionResetComplete();
  }, [shouldResetSelection, actionActions, onSelectionResetComplete]);

  return <InspectorPanel />;
};

export const useInspectorDrawerState = (isMobile: boolean) => {
  const [isInspectorOpen, setIsInspectorOpen] = React.useState(false);

  const handleNodeSelect = React.useCallback(
    (hasSelection: boolean) => {
      if (!isMobile) {
        return;
      }

      setIsInspectorOpen((prev) => {
        if (prev === hasSelection) {
          return prev;
        }
        return hasSelection;
      });
    },
    [isMobile],
  );

  const handleInspectorStateChange = React.useCallback((open: boolean) => {
    setIsInspectorOpen(open);
  }, []);

  return { isInspectorOpen, handleNodeSelect, handleInspectorStateChange };
};

/**
 * Mobile drawer layout example
 * Uses drawer behavior for inspector panel on mobile devices
 */
export const MobileDrawerExample: React.FC = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [shouldResetSelection, setShouldResetSelection] = React.useState(false);

  const { isInspectorOpen, handleNodeSelect, handleInspectorStateChange: baseHandleInspectorStateChange } =
    useInspectorDrawerState(isMobile);

  const handleSelectionResetComplete = React.useCallback(() => {
    setShouldResetSelection(false);
  }, []);

  const handleInspectorStateChange = React.useCallback(
    (open: boolean) => {
      baseHandleInspectorStateChange(open);
      if (!open) {
        setShouldResetSelection(true);
      } else {
        setShouldResetSelection(false);
      }
    },
    [baseHandleInspectorStateChange],
  );

  // Check if we're on mobile on mount and viewport changes
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice() || isMobileViewport());
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
        component: isMobile ? (
          <InspectorWithDrawerControl
            onNodeSelect={handleNodeSelect}
            shouldResetSelection={shouldResetSelection}
            onSelectionResetComplete={handleSelectionResetComplete}
          />
        ) : (
          <InspectorPanel />
        ),
        // Use drawer on mobile, fixed position on desktop
        ...(isMobile
          ? {
              drawer: {
                placement: "right",
                open: isInspectorOpen,
                dismissible: true,
                showBackdrop: true,
                backdropOpacity: 0.5,
                size: "80%",
                onStateChange: handleInspectorStateChange,
                header: {
                  title: "Inspector",
                  showCloseButton: true,
                },
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
    [
      isMobile,
      isInspectorOpen,
      handleInspectorStateChange,
      handleNodeSelect,
      shouldResetSelection,
      handleSelectionResetComplete,
    ],
  );

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <NodeEditor
        gridConfig={gridConfig}
        gridLayers={gridLayers}
        initialData={initialData}
        nodeDefinitions={[asNodeDefinition(StandardNodeDefinition)]}
      />

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
        {isMobile && (
          <>
            <br />
            <small>Tap a node to open inspector</small>
          </>
        )}
      </div>
    </div>
  );
};
