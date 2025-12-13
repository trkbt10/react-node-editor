/**
 * @file Status bar component
 */
import * as React from "react";
import { useNodeEditor } from "../../contexts/composed/node-editor/context";
import { useEditorActionState } from "../../contexts/composed/EditorActionStateContext";
import { useCanvasInteraction } from "../../contexts/composed/canvas/interaction/context";
import { useNodeCanvas } from "../../contexts/composed/canvas/viewport/context";
import type { SettingsManager as _SettingsManager } from "../../settings/SettingsManager";
import { StatusSection } from "./StatusSection";
import styles from "./StatusBar.module.css";

export type StatusBarProps = {
  autoSave?: boolean;
  isSaving?: boolean;
  settingsManager?: _SettingsManager;
};

/**
 * StatusBar - Displays current editor state information
 * Settings are retrieved from NodeEditorContext if not provided via props.
 */
export const StatusBar: React.FC<StatusBarProps> = React.memo(({
  autoSave: autoSaveProp,
  isSaving: isSavingProp,
  settingsManager: settingsManagerProp,
}) => {
  const { settings, isSaving: editorIsSaving, settingsManager: editorSettingsManager } = useNodeEditor();

  const autoSave = autoSaveProp ?? settings.autoSave;
  const isSaving = isSavingProp ?? editorIsSaving;
  const settingsManager = settingsManagerProp ?? editorSettingsManager;
  const { state: nodeEditorState } = useNodeEditor();
  const { state: actionState } = useEditorActionState();
  const { state: interactionState, actions: _interactionActions } = useCanvasInteraction();
  const { state: canvasState } = useNodeCanvas();

  const selectedNodeCount = actionState.selectedNodeIds.length;
  const selectedConnectionCount = actionState.selectedConnectionIds.length;
  const totalNodes = Object.keys(nodeEditorState.nodes).length;
  const totalConnections = Object.keys(nodeEditorState.connections).length;

  const zoomPercentage = Math.round(canvasState.viewport.scale * 100);

  const selectionValue = React.useMemo(() => {
    if (selectedNodeCount === 0 && selectedConnectionCount === 0) {
      return "None";
    }
    const parts: string[] = [];
    if (selectedNodeCount > 0) {
      parts.push(`${selectedNodeCount} node${selectedNodeCount !== 1 ? "s" : ""}`);
    }
    if (selectedConnectionCount > 0) {
      parts.push(`${selectedConnectionCount} connection${selectedConnectionCount !== 1 ? "s" : ""}`);
    }
    return parts.join(", ");
  }, [selectedNodeCount, selectedConnectionCount]);

  const gridValue = React.useMemo(() => {
    if (!canvasState.gridSettings.showGrid) {
      return null;
    }
    const snapText = canvasState.gridSettings.snapToGrid ? " (Snap ON)" : "";
    return `${canvasState.gridSettings.size}px${snapText}`;
  }, [canvasState.gridSettings.showGrid, canvasState.gridSettings.size, canvasState.gridSettings.snapToGrid]);

  // Determine operation mode
  const operationMode = React.useMemo((): string => {
    if (interactionState.dragState) {
      return "Moving";
    }
    if (interactionState.selectionBox) {
      return "Selecting";
    }
    if (interactionState.connectionDragState) {
      return "Connecting";
    }
    if (canvasState.isSpacePanning || canvasState.panState.isPanning) {
      return "Panning";
    }
    return "Ready";
  }, [
    interactionState.dragState,
    interactionState.selectionBox,
    interactionState.connectionDragState,
    canvasState.isSpacePanning,
    canvasState.panState.isPanning,
  ]);

  // Get cursor position (if dragging)
  const cursorPosition = React.useMemo(() => {
    if (interactionState.dragState) {
      return `Offset: (${Math.round(interactionState.dragState.offset.x)}, ${Math.round(interactionState.dragState.offset.y)})`;
    }
    return `Canvas: (${Math.round(canvasState.viewport.offset.x)}, ${Math.round(canvasState.viewport.offset.y)})`;
  }, [
    interactionState.dragState,
    canvasState.viewport.offset.x,
    canvasState.viewport.offset.y,
  ]);

  return (
    <div className={styles.statusBar} data-testid="status-bar">
      {/* Selection info */}
      <StatusSection
        label="Selection"
        value={selectionValue}
      />

      {/* Total counts */}
      <StatusSection label="Total" value={`${totalNodes} nodes, ${totalConnections} connections`} />

      {/* Operation mode */}
      <StatusSection label="Mode" value={operationMode} variant="mode" />

      {/* Zoom level */}
      <StatusSection label="Zoom" value={`${zoomPercentage}%`} />

      {/* Position */}
      <StatusSection label="Position" value={cursorPosition} />

      {/* Grid info */}
      {gridValue && <StatusSection label="Grid" value={gridValue} />}

      {/* Auto-save status */}
      {autoSave && (
        <StatusSection
          label="Auto-save"
          value={isSaving ? "Saving..." : "ON"}
          variant={isSaving ? "saving" : undefined}
        />
      )}

      {/* Theme info */}
      {settingsManager && (
        <StatusSection label="Theme" value={settingsManager.getValue("appearance.theme") || "light"} />
      )}
    </div>
  );
});

StatusBar.displayName = "StatusBar";
