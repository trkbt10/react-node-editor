import * as React from "react";
import { useNodeEditor } from "../../contexts/node-editor";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import type { SettingsManager } from "../../settings/SettingsManager";
import { classNames } from "../elements";
import { StatusSection, statusSectionStyles } from "./StatusSection";
import styles from "./StatusBar.module.css";

export type StatusBarProps = {
  className?: string;
  autoSave?: boolean;
  isSaving?: boolean;
  settingsManager?: SettingsManager;
}

/**
 * StatusBar - Displays current editor state information
 * Settings are retrieved from NodeEditorContext if not provided via props.
 */
export const StatusBar: React.FC<StatusBarProps> = ({
  className,
  autoSave: autoSaveProp,
  isSaving: isSavingProp,
  settingsManager: settingsManagerProp
}) => {
  const { settings, isSaving: editorIsSaving, settingsManager: editorSettingsManager } = useNodeEditor();

  const autoSave = autoSaveProp ?? settings.autoSave;
  const isSaving = isSavingProp ?? editorIsSaving;
  const settingsManager = settingsManagerProp ?? editorSettingsManager;
  const { state: nodeEditorState } = useNodeEditor();
  const { state: actionState } = useEditorActionState();
  const { state: canvasState } = useNodeCanvas();

  const selectedNodeCount = actionState.selectedNodeIds.length;
  const selectedConnectionCount = actionState.selectedConnectionIds.length;
  const totalNodes = Object.keys(nodeEditorState.nodes).length;
  const totalConnections = Object.keys(nodeEditorState.connections).length;

  const zoomPercentage = Math.round(canvasState.viewport.scale * 100);

  // Determine operation mode
  const getOperationMode = (): string => {
    if (actionState.dragState) {return "Moving";}
    if (actionState.selectionBox) {return "Selecting";}
    if (actionState.connectionDragState) {return "Connecting";}
    if (canvasState.isSpacePanning || canvasState.panState.isPanning) {return "Panning";}
    return "Ready";
  };

  const operationMode = getOperationMode();

  // Get cursor position (if dragging)
  const getCursorPosition = () => {
    if (actionState.dragState) {
      return `Offset: (${Math.round(actionState.dragState.offset.x)}, ${Math.round(actionState.dragState.offset.y)})`;
    }
    return `Canvas: (${Math.round(canvasState.viewport.offset.x)}, ${Math.round(canvasState.viewport.offset.y)})`;
  };

  return (
    <div className={classNames(styles.statusBar, className)} data-testid="status-bar">
      {/* Selection info */}
      <StatusSection
        label="Selection"
        value={
          <>
            {selectedNodeCount > 0 && `${selectedNodeCount} node${selectedNodeCount !== 1 ? 's' : ''}`}
            {selectedNodeCount > 0 && selectedConnectionCount > 0 && ', '}
            {selectedConnectionCount > 0 && `${selectedConnectionCount} connection${selectedConnectionCount !== 1 ? 's' : ''}`}
            {selectedNodeCount === 0 && selectedConnectionCount === 0 && 'None'}
          </>
        }
      />

      {/* Total counts */}
      <StatusSection
        label="Total"
        value={`${totalNodes} nodes, ${totalConnections} connections`}
      />

      {/* Operation mode */}
      <StatusSection
        label="Mode"
        value={operationMode}
        valueClassName={statusSectionStyles.statusMode}
      />

      {/* Zoom level */}
      <StatusSection
        label="Zoom"
        value={`${zoomPercentage}%`}
      />

      {/* Position */}
      <StatusSection
        label="Position"
        value={getCursorPosition()}
      />

      {/* Grid info */}
      {canvasState.gridSettings.showGrid && (
        <StatusSection
          label="Grid"
          value={
            <>
              {canvasState.gridSettings.size}px
              {canvasState.gridSettings.snapToGrid && ' (Snap ON)'}
            </>
          }
        />
      )}

      {/* Auto-save status */}
      {autoSave && (
        <StatusSection
          label="Auto-save"
          value={isSaving ? 'Saving...' : 'ON'}
          valueClassName={isSaving ? statusSectionStyles.statusSaving : undefined}
        />
      )}

      {/* Theme info */}
      {settingsManager && (
        <StatusSection
          label="Theme"
          value={settingsManager.getValue("appearance.theme") || "light"}
        />
      )}
    </div>
  );
};

StatusBar.displayName = "StatusBar";
