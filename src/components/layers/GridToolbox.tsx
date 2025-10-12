/**
 * @file Grid toolbox component
 */
import * as React from "react";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { useNodeEditor } from "../../contexts/node-editor";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import styles from "./GridToolbox.module.css";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type GridToolboxProps = {
  // No props needed - layout is handled by GridLayout
}

const ZOOM_PRESETS = [5, 10, 25, 50, 100, 200, 400, 800] as const;

// Memoized zoom button component
const ZoomButton = React.memo<{
  onClick: () => void;
  title: string;
  ariaLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
}>(({ onClick, title, ariaLabel, disabled, children }) => (
  <button
    className={styles.toolButton}
    onClick={onClick}
    title={title}
    aria-label={ariaLabel}
    disabled={disabled}
  >
    {children}
  </button>
));
ZoomButton.displayName = "ZoomButton";

// Memoized toggle button component
const ToggleButton = React.memo<{
  active: boolean;
  onClick: () => void;
  title: string;
  ariaLabel: string;
  children: React.ReactNode;
}>(({ active, onClick, title, ariaLabel, children }) => (
  <button
    className={`${styles.toolButton} ${active ? styles.active : ""}`}
    onClick={onClick}
    title={title}
    aria-label={ariaLabel}
  >
    {children}
  </button>
));
ToggleButton.displayName = "ToggleButton";

// Memoized status indicator component
const StatusIndicator = React.memo<{
  label: string;
  value: number;
}>(({ label, value }) => (
  <div className={styles.statusIndicator}>
    <span className={styles.statusLabel}>{label}:</span>
    <span className={styles.statusValue}>{value}</span>
  </div>
));
StatusIndicator.displayName = "StatusIndicator";

export const GridToolbox: React.FC<GridToolboxProps> = React.memo(() => {
  const { state: canvasState, actions: canvasActions, dispatch: canvasDispatch } = useNodeCanvas();
  const { state: editorState } = useNodeEditor();
  const { state: actionState } = useEditorActionState();

  const zoomPercentage = React.useMemo(
    () => Math.round(canvasState.viewport.scale * 100),
    [canvasState.viewport.scale]
  );

  const nodeCount = React.useMemo(
    () => Object.keys(editorState.nodes).length,
    [editorState.nodes]
  );

  const connectionCount = React.useMemo(
    () => Object.keys(editorState.connections).length,
    [editorState.connections]
  );

  const selectedNodeCount = React.useMemo(
    () => actionState.selectedNodeIds.length,
    [actionState.selectedNodeIds]
  );

  const handleZoomIn = React.useCallback(() => {
    const newScale = Math.min(canvasState.viewport.scale * 1.25, 10);
    canvasDispatch(
      canvasActions.setViewport({
        ...canvasState.viewport,
        scale: newScale,
      })
    );
  }, [canvasState.viewport, canvasDispatch, canvasActions]);

  const handleZoomOut = React.useCallback(() => {
    const newScale = Math.max(canvasState.viewport.scale * 0.8, 0.1);
    canvasDispatch(
      canvasActions.setViewport({
        ...canvasState.viewport,
        scale: newScale,
      })
    );
  }, [canvasState.viewport, canvasDispatch, canvasActions]);

  const handleZoomReset = React.useCallback(() => {
    canvasDispatch(
      canvasActions.setViewport({
        ...canvasState.viewport,
        scale: 1,
      })
    );
  }, [canvasState.viewport, canvasDispatch, canvasActions]);

  const handleZoomToFit = React.useCallback(() => {
    const nodes = Object.values(editorState.nodes);
    if (nodes.length === 0) {return;}

    // Calculate bounding box of all nodes
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + (node.size?.width ?? 150));
      maxY = Math.max(maxY, node.position.y + (node.size?.height ?? 50));
    });

    const padding = 50;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scaleX = viewportWidth / contentWidth;
    const scaleY = viewportHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    canvasDispatch(
      canvasActions.setViewport({
        scale,
        offset: {
          x: -(centerX * scale - viewportWidth / 2),
          y: -(centerY * scale - viewportHeight / 2),
        },
      })
    );
  }, [editorState.nodes, canvasDispatch, canvasActions]);

  const handleZoomToSelection = React.useCallback(() => {
    if (selectedNodeCount === 0) {return;}

    const selectedNodes = actionState.selectedNodeIds
      .map((id) => editorState.nodes[id])
      .filter((node): node is NonNullable<typeof node> => node != null);
    
    if (selectedNodes.length === 0) {return;}

    // Calculate bounding box of selected nodes
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    selectedNodes.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + (node.size?.width ?? 150));
      maxY = Math.max(maxY, node.position.y + (node.size?.height ?? 50));
    });

    const padding = 50;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scaleX = viewportWidth / contentWidth;
    const scaleY = viewportHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, 2);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    canvasDispatch(
      canvasActions.setViewport({
        scale,
        offset: {
          x: -(centerX * scale - viewportWidth / 2),
          y: -(centerY * scale - viewportHeight / 2),
        },
      })
    );
  }, [editorState.nodes, actionState.selectedNodeIds, selectedNodeCount, canvasDispatch, canvasActions]);

  const handlePresetZoom = React.useCallback(
    (preset: number) => {
      canvasDispatch(
        canvasActions.setViewport({
          ...canvasState.viewport,
          scale: preset / 100,
        })
      );
    },
    [canvasState.viewport, canvasDispatch, canvasActions]
  );

  const handleToggleGrid = React.useCallback(() => {
    canvasDispatch(
      canvasActions.updateGridSettings({ 
        showGrid: !canvasState.gridSettings.showGrid 
      })
    );
  }, [canvasState.gridSettings.showGrid, canvasDispatch, canvasActions]);

  const handleToggleSnapToGrid = React.useCallback(() => {
    canvasDispatch(
      canvasActions.updateGridSettings({ 
        snapToGrid: !canvasState.gridSettings.snapToGrid 
      })
    );
  }, [canvasState.gridSettings.snapToGrid, canvasDispatch, canvasActions]);

  // Memoized zoom select options
  const zoomOptions = React.useMemo(() => {
    const options = ZOOM_PRESETS.map((preset) => (
      <option key={preset} value={preset}>
        {preset}%
      </option>
    ));
    
    if (!ZOOM_PRESETS.includes(zoomPercentage as typeof ZOOM_PRESETS[number])) {
      options.push(
        <option key={zoomPercentage} value={zoomPercentage}>
          {zoomPercentage}%
        </option>
      );
    }
    
    return options;
  }, [zoomPercentage]);

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarSection}>
        {/* Zoom controls */}
        <ZoomButton
          onClick={handleZoomOut}
          title="Zoom Out (Cmd -)"
          ariaLabel="Zoom Out"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
          </svg>
        </ZoomButton>

        <div className={styles.zoomDisplay}>
          <select
            className={styles.zoomSelect}
            value={zoomPercentage}
            onChange={(e) => handlePresetZoom(Number(e.target.value))}
          >
            {zoomOptions}
          </select>
        </div>

        <ZoomButton
          onClick={handleZoomIn}
          title="Zoom In (Cmd +)"
          ariaLabel="Zoom In"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4a.5.5 0 0 1 .5.5V7.5H11.5a.5.5 0 0 1 0 1H8.5V11.5a.5.5 0 0 1-1 0V8.5H4.5a.5.5 0 0 1 0-1H7.5V4.5A.5.5 0 0 1 8 4z" />
          </svg>
        </ZoomButton>
      </div>

      <div className={styles.separator} />

      <div className={styles.toolbarSection}>
        {/* Zoom presets */}
        <ZoomButton
          onClick={handleZoomToFit}
          title="Zoom to Fit All (Shift 1)"
          ariaLabel="Zoom to Fit All"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.5 2.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-9zm0 1h9v9h-9v-9z" />
            <path d="M6 6h4v4H6V6z" opacity="0.5" />
          </svg>
        </ZoomButton>

        <ZoomButton
          onClick={handleZoomToSelection}
          title="Zoom to Selection (Shift 2)"
          ariaLabel="Zoom to Selection"
          disabled={selectedNodeCount === 0}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 6h4v4H6V6z" />
            <path
              d="M3.5 2.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-9zm0 1h9v9h-9v-9z"
              opacity="0.5"
            />
          </svg>
        </ZoomButton>

        <ZoomButton
          onClick={handleZoomReset}
          title="Reset Zoom (Cmd 0)"
          ariaLabel="Reset Zoom"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <text x="8" y="12" textAnchor="middle" fontSize="10" fontWeight="600">
              1:1
            </text>
          </svg>
        </ZoomButton>
      </div>

      <div className={styles.separator} />

      <div className={styles.toolbarSection}>
        {/* Grid toggle */}
        <ToggleButton
          active={canvasState.gridSettings.showGrid}
          onClick={handleToggleGrid}
          title="Toggle Grid (Cmd ')"
          ariaLabel="Toggle Grid"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path
              d="M2 2h2v2H2V2zm4 0h2v2H6V2zm4 0h2v2h-2V2zm4 0h2v2h-2V2zM2 6h2v2H2V6zm4 0h2v2H6V6zm4 0h2v2h-2V6zm4 0h2v2h-2V6zM2 10h2v2H2v-2zm4 0h2v2H6v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM2 14h2v2H2v-2zm4 0h2v2H6v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"
              opacity="0.6"
            />
          </svg>
        </ToggleButton>

        {/* Snap to grid toggle */}
        <ToggleButton
          active={canvasState.gridSettings.snapToGrid}
          onClick={handleToggleSnapToGrid}
          title="Toggle Snap to Grid"
          ariaLabel="Toggle Snap to Grid"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            <circle cx="8" cy="8" r="2" fill="currentColor" />
          </svg>
        </ToggleButton>
      </div>

      <div className={styles.toolbarSpacer} />

      <div className={styles.toolbarSection}>
        {/* Node count indicator */}
        <StatusIndicator label="Nodes" value={nodeCount} />

        {/* Connection count indicator */}
        <StatusIndicator label="Connections" value={connectionCount} />
      </div>
    </div>
  );
});

GridToolbox.displayName = "GridToolbox";
