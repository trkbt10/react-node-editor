import * as React from "react";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeEditor } from "../../contexts/node-editor";
import { SelectionOverlay } from "./SelectionOverlay";
import { classNames } from "../elements";
import styles from "./CanvasBase.module.css";

export type CanvasBaseProps = {
  children: React.ReactNode;
  className?: string;
  showGrid?: boolean;
}

/**
 * CanvasBase - The lowest layer component that handles pan, zoom, and drag operations
 * This component receives events and provides visual support with grid display
 * Does not trap events unless necessary for its own operations
 */
export const CanvasBase: React.FC<CanvasBaseProps> = ({ children, className, showGrid = true }) => {
  const { state: canvasState, dispatch: canvasDispatch, actions: canvasActions, canvasRef, utils } = useNodeCanvas();
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const { state: nodeEditorState } = useNodeEditor();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isBoxSelecting, setIsBoxSelecting] = React.useState(false);

  // Canvas transform based on viewport - optimized string creation
  const canvasTransform = React.useMemo(() => {
    const { offset, scale } = canvasState.viewport;
    return `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
  }, [canvasState.viewport]);

  // Grid pattern with offset - optimized dependencies
  const gridPattern = React.useMemo(() => {
    if (!canvasState.gridSettings.showGrid) {return null;}

    const { size } = canvasState.gridSettings;
    const { scale, offset } = canvasState.viewport;
    const scaledSize = size * scale;
    const offsetX = offset.x % scaledSize;
    const offsetY = offset.y % scaledSize;

    return (
      <defs>
        <pattern id="grid" width={scaledSize} height={scaledSize} patternUnits="userSpaceOnUse" x={offsetX} y={offsetY}>
          <path d={`M ${scaledSize} 0 L 0 0 0 ${scaledSize}`} fill="none" strokeWidth="1" className={styles.gridLine} />
        </pattern>
      </defs>
    );
  }, [canvasState.gridSettings, canvasState.viewport]);

  // Handle mouse wheel for zoom (Figma style)
  const handleWheel = React.useCallback(
    (e: WheelEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {return;}

      // Figma style: Ctrl/Cmd + wheel for zoom, otherwise pan
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const center = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        // More responsive zoom with larger delta
        const delta = e.deltaY * -0.01;
        const newScale = canvasState.viewport.scale * (1 + delta);

        canvasDispatch(canvasActions.zoomViewport(newScale, center));
      } else {
        // Normal scroll for panning
        e.preventDefault();
        
        // Invert deltaX for horizontal scrolling (Figma behavior)
        const deltaX = -e.deltaX;
        const deltaY = -e.deltaY;
        
        canvasDispatch(canvasActions.panViewport({ x: deltaX, y: deltaY }));
      }
    },
    [canvasState.viewport.scale, canvasDispatch, canvasActions],
  );

  // Handle panning with middle mouse button or space+drag, and box selection
  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      // Middle mouse button or space key panning
      if (e.button === 1 || canvasState.isSpacePanning) {
        e.preventDefault();
        canvasDispatch(canvasActions.startPan({ x: e.clientX, y: e.clientY }));

        if (containerRef.current) {
          containerRef.current.setPointerCapture(e.pointerId);
        }
        return;
      }

      // Left click for box selection (if not clicking on interactive elements)
      // More permissive targeting - only exclude specific interactive elements
      const target = e.target as Element;
      // Use data- attributes (CSS Modules class names are hashed)
      const isInteractiveElement = target?.closest?.('[data-node-id], [data-port-id], [data-connection-id], button, input, textarea, [role="button"]');
      
      
      // Allow box selection unless clicking on interactive elements
      if (e.button === 0 && !isInteractiveElement) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {return;}

        // Use screen coordinates for selection box display
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Start box selection
        setIsBoxSelecting(true);
        actionDispatch(actionActions.setSelectionBox({
          start: { x: screenX, y: screenY },
          end: { x: screenX, y: screenY },
        }));

        // Clear current selection if not holding modifier keys
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          actionDispatch(actionActions.clearSelection());
        }

        if (containerRef.current) {
          containerRef.current.setPointerCapture(e.pointerId);
        }
      }
    },
    [canvasState.isSpacePanning, canvasState.viewport, canvasDispatch, canvasActions, actionDispatch, actionActions],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (canvasState.panState.isPanning) {
        canvasDispatch(canvasActions.updatePan({ x: e.clientX, y: e.clientY }));
      } else if (isBoxSelecting && actionState.selectionBox) {
        // Update selection box in screen coordinates
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {return;}

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        actionDispatch(actionActions.setSelectionBox({
          start: actionState.selectionBox.start,
          end: { x: screenX, y: screenY },
        }));
      }
    },
    [canvasState.panState.isPanning, canvasState.viewport, isBoxSelecting, actionState.selectionBox, canvasDispatch, canvasActions, actionDispatch, actionActions],
  );

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      if (canvasState.panState.isPanning) {
        canvasDispatch(canvasActions.endPan());

        if (containerRef.current) {
          containerRef.current.releasePointerCapture(e.pointerId);
        }
      } else if (isBoxSelecting && actionState.selectionBox) {
        // Complete box selection
        setIsBoxSelecting(false);

        // Convert screen coordinates back to canvas coordinates for node intersection check
        const { start, end } = actionState.selectionBox;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {return;}

        // Convert selection box bounds to canvas coordinates
        const canvasStartX = (start.x - canvasState.viewport.offset.x) / canvasState.viewport.scale;
        const canvasStartY = (start.y - canvasState.viewport.offset.y) / canvasState.viewport.scale;
        const canvasEndX = (end.x - canvasState.viewport.offset.x) / canvasState.viewport.scale;
        const canvasEndY = (end.y - canvasState.viewport.offset.y) / canvasState.viewport.scale;

        const minX = Math.min(canvasStartX, canvasEndX);
        const maxX = Math.max(canvasStartX, canvasEndX);
        const minY = Math.min(canvasStartY, canvasEndY);
        const maxY = Math.max(canvasStartY, canvasEndY);

        const selectedNodeIds: string[] = [];
        Object.values(nodeEditorState.nodes).forEach(node => {
          const nodeWidth = node.size?.width || 150;
          const nodeHeight = node.size?.height || 50;
          
          // Check if node intersects with selection box in canvas coordinates
          const intersects = (
            node.position.x < maxX &&
            node.position.x + nodeWidth > minX &&
            node.position.y < maxY &&
            node.position.y + nodeHeight > minY
          );
          
          if (intersects) {
            selectedNodeIds.push(node.id);
          }
        });

        // Update selection
        if (selectedNodeIds.length > 0) {
          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            // Add to existing selection
            const newSelection = [...new Set([...actionState.selectedNodeIds, ...selectedNodeIds])];
            actionDispatch(actionActions.selectAllNodes(newSelection));
          } else {
            // Replace selection
            actionDispatch(actionActions.selectAllNodes(selectedNodeIds));
          }
        }

        // Clear selection box
        actionDispatch(actionActions.setSelectionBox(null));

        if (containerRef.current) {
          containerRef.current.releasePointerCapture(e.pointerId);
        }
      }
    },
    [canvasState.panState.isPanning, isBoxSelecting, actionState.selectionBox, actionState.selectedNodeIds, nodeEditorState.nodes, canvasDispatch, canvasActions, actionDispatch, actionActions],
  );

  // Handle context menu
  const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Convert screen coordinates to canvas coordinates using utils
    const canvasPosition = utils.screenToCanvas(e.clientX, e.clientY);

    const position = {
      x: e.clientX, // Keep screen coordinates for menu positioning
      y: e.clientY,
    };

    // Show context menu for canvas (no specific node)
    actionDispatch(actionActions.showContextMenu(position, undefined, canvasPosition));
  }, [actionDispatch, actionActions, utils]);

  // Handle double click to open Node Search
  const handleDoubleClick = React.useCallback((e: React.MouseEvent) => {
    // Convert screen coordinates to canvas coordinates using utils
    const canvasPosition = utils.screenToCanvas(e.clientX, e.clientY);
    const position = { x: e.clientX, y: e.clientY };
    actionDispatch(actionActions.showContextMenu(position, undefined, canvasPosition, undefined, 'search'));
  }, [actionDispatch, actionActions, utils]);

  // Handle keyboard shortcuts (Figma style)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space for panning mode
      if (e.code === "Space" && !e.repeat && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        canvasDispatch(canvasActions.setSpacePanning(true));
      }
      
      // Figma style zoom shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.repeat) {
        switch(e.key) {
          case '0': // Reset zoom to 100%
            e.preventDefault();
            canvasDispatch(canvasActions.resetViewport());
            break;
          case '1': // Zoom to fit
            e.preventDefault();
            // TODO: Implement zoom to fit
            break;
          case '=':
          case '+': // Zoom in
            e.preventDefault();
            canvasDispatch(canvasActions.zoomViewport(canvasState.viewport.scale * 1.2));
            break;
          case '-': // Zoom out
            e.preventDefault();
            canvasDispatch(canvasActions.zoomViewport(canvasState.viewport.scale * 0.8));
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        canvasDispatch(canvasActions.setSpacePanning(false));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [canvasDispatch, canvasActions, canvasState.viewport.scale]);

  // Set up wheel event listener
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {return;}

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div
      ref={containerRef}
      className={classNames(
        styles.canvasContainer,
        canvasState.panState.isPanning && styles.panning,
        canvasState.isSpacePanning && styles.spacePanning,
        isBoxSelecting && styles.boxSelecting,
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      role="application"
      aria-label="Node Editor Canvas"
    >
      {/* Grid background */}
      {canvasState.gridSettings.showGrid && (
        <svg className={styles.gridSvg}>
          {gridPattern}
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      )}

      {/* Canvas layer with transform */}
      <div ref={canvasRef} className={styles.canvas} style={{ transform: canvasTransform }}>
        {children}
      </div>

      {/* Selection overlay (in screen coordinates, passes through events) */}
      <SelectionOverlay />
    </div>
  );
};

CanvasBase.displayName = "CanvasBase";
