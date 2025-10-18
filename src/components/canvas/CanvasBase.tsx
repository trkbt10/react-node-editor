/**
 * @file CanvasBase component
 */
import * as React from "react";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { applyZoomDelta, clampZoomScale } from "../../utils/zoomUtils";
import { SelectionOverlay } from "./SelectionOverlay";
import styles from "./CanvasBase.module.css";
import { useInteractionSettings } from "../../contexts/InteractionSettingsContext";
import type { PointerType } from "../../types/interaction";
import type { Position } from "../../types/core";
import { NODE_DRAG_MIME } from "../../constants/dnd";
import { usePointerShortcutMatcher } from "../../hooks/usePointerShortcutMatcher";
import {
  evaluateCanvasPointerIntent,
  hasExceededCanvasDragThreshold,
  normalizePointerType,
  type CanvasPointerIntent,
} from "../../utils/canvasPointerIntent";

export type CanvasNodeDropEvent = {
  nodeType: string;
  canvasPosition: Position;
  screenPosition: Position;
};

export type CanvasBaseProps = {
  children: React.ReactNode;
  className?: string;
  showGrid?: boolean;
  onNodeDrop?: (event: CanvasNodeDropEvent) => void;
};

type PinchPointer = {
  clientX: number;
  clientY: number;
  pointerType: PointerType;
};

type PinchState = {
  initialDistance: number;
  initialScale: number;
  lastScale: number;
  center: { x: number; y: number };
};

type PrimaryPointerState =
  | {
      pointerId: number;
      origin: { x: number; y: number };
      intent: CanvasPointerIntent;
      status: "pending" | "pan" | "range-select";
    }
  | null;

const INTERACTIVE_TARGET_SELECTOR =
  '[data-node-id], [data-port-id], [data-connection-id], button, input, textarea, [role="button"]';

const PINCH_SCALE_EPSILON = 1e-4;

const pointerTypeFromEvent = (event: React.PointerEvent): PointerType => {
  return normalizePointerType(event.pointerType);
};

const isInteractiveElement = (target: Element | null): boolean => {
  return Boolean(target?.closest?.(INTERACTIVE_TARGET_SELECTOR));
};

const distanceBetween = (a: PinchPointer, b: PinchPointer): number => {
  const dx = b.clientX - a.clientX;
  const dy = b.clientY - a.clientY;
  return Math.hypot(dx, dy);
};

const hasNodePayload = (event: React.DragEvent): boolean => {
  const types = Array.from(event.dataTransfer?.types ?? []);
  return types.includes(NODE_DRAG_MIME) || types.includes("text/plain");
};

/**
 * CanvasBase - The lowest layer component that handles pan, zoom, and drag operations
 * This component receives events and provides visual support with grid display
 * Does not trap events unless necessary for its own operations
 */
export const CanvasBase: React.FC<CanvasBaseProps> = ({ children, className, onNodeDrop }) => {
  const { state: canvasState, actions: canvasActions, canvasRef, utils, setContainerElement } = useNodeCanvas();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: nodeEditorState } = useNodeEditor();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rawGridPatternId = React.useId();
  const gridPatternId = React.useMemo(() => rawGridPatternId.replace(/[^a-zA-Z0-9_-]/g, "_"), [rawGridPatternId]);
  const [isBoxSelecting, setIsBoxSelecting] = React.useState(false);
  const primaryPointerRef = React.useRef<PrimaryPointerState>(null);
  const interactionSettings = useInteractionSettings();
  const matchesPointerAction = usePointerShortcutMatcher();
  const activePinchPointersRef = React.useRef<Map<number, PinchPointer>>(new Map());
  const pinchStateRef = React.useRef<PinchState | null>(null);
  const [isPinching, setIsPinching] = React.useState(false);
  const pinchPointerTypes = React.useMemo(() => new Set(interactionSettings.pinchZoom.pointerTypes), [interactionSettings.pinchZoom.pointerTypes]);
  const pinchMinDistance = interactionSettings.pinchZoom.minDistance ?? 0;

  React.useEffect(() => {
    setContainerElement(containerRef.current);
    return () => setContainerElement(null);
  }, [setContainerElement]);

  const tryStartPinch = React.useCallback((): boolean => {
    if (!interactionSettings.pinchZoom.enabled) {
      return false;
    }

    const container = containerRef.current;
    if (!container) {
      return false;
    }

    const pointers = Array.from(activePinchPointersRef.current.values());
    if (pointers.length !== 2) {
      return false;
    }

    const distance = distanceBetween(pointers[0], pointers[1]);
    if (distance < pinchMinDistance) {
      return false;
    }

    const rect = container.getBoundingClientRect();
    const center = {
      x: (pointers[0].clientX + pointers[1].clientX) / 2 - rect.left,
      y: (pointers[0].clientY + pointers[1].clientY) / 2 - rect.top,
    };

    pinchStateRef.current = {
      initialDistance: distance,
      initialScale: canvasState.viewport.scale,
      lastScale: canvasState.viewport.scale,
      center,
    };

    if (isBoxSelecting) {
      setIsBoxSelecting(false);
      actionActions.setSelectionBox(null);
    }

    if (canvasState.panState.isPanning) {
      canvasActions.endPan();
    }

    setIsPinching(true);
    return true;
  }, [
    interactionSettings.pinchZoom.enabled,
    pinchMinDistance,
    canvasState.viewport.scale,
    canvasState.panState.isPanning,
    isBoxSelecting,
    actionActions,
    canvasActions,
  ]);

  const updatePinchZoom = React.useCallback(() => {
    const container = containerRef.current;
    const pinchState = pinchStateRef.current;
    if (!container || !pinchState) {
      return;
    }

    const pointers = Array.from(activePinchPointersRef.current.values());
    if (pointers.length < 2) {
      return;
    }

    const distance = distanceBetween(pointers[0], pointers[1]);
    if (distance <= 0) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const center = {
      x: (pointers[0].clientX + pointers[1].clientX) / 2 - rect.left,
      y: (pointers[0].clientY + pointers[1].clientY) / 2 - rect.top,
    };

    const targetScale = clampZoomScale((pinchState.initialScale * distance) / pinchState.initialDistance);
    if (Math.abs(targetScale - pinchState.lastScale) > PINCH_SCALE_EPSILON) {
      canvasActions.zoomViewport(targetScale, center);
      pinchStateRef.current = {
        ...pinchState,
        lastScale: targetScale,
        center,
      };
    } else {
      pinchStateRef.current = {
        ...pinchState,
        center,
      };
    }
  }, [canvasActions]);

  const endPinch = React.useCallback(() => {
    if (!isPinching) {
      return;
    }
    setIsPinching(false);
    pinchStateRef.current = null;
  }, [isPinching]);

  // Canvas transform based on viewport - optimized string creation
  const canvasTransform = React.useMemo(() => {
    const { offset, scale } = canvasState.viewport;
    return `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
  }, [canvasState.viewport]);

  // Grid pattern with offset - optimized dependencies
  const gridPatternDefs = React.useMemo(() => {
    if (!canvasState.gridSettings.showGrid) {
      return null;
    }

    const { size } = canvasState.gridSettings;
    const { scale, offset } = canvasState.viewport;
    const scaledSize = size * scale;
    const offsetX = offset.x % scaledSize;
    const offsetY = offset.y % scaledSize;

    return (
      <defs>
        <pattern
          id={gridPatternId}
          width={scaledSize}
          height={scaledSize}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path d={`M ${scaledSize} 0 L 0 0 0 ${scaledSize}`} fill="none" strokeWidth="1" className={styles.gridLine} />
        </pattern>
      </defs>
    );
  }, [canvasState.gridSettings, canvasState.viewport, gridPatternId]);

  const gridPatternFill = React.useMemo(() => `url(#${gridPatternId})`, [gridPatternId]);

  const handleDragEnter = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!onNodeDrop) {
        return;
      }
      if (!hasNodePayload(event)) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    [onNodeDrop],
  );

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!onNodeDrop) {
        return;
      }
      if (!hasNodePayload(event)) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    [onNodeDrop],
  );

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!onNodeDrop) {
        return;
      }
      if (!hasNodePayload(event)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const nodeType = event.dataTransfer.getData(NODE_DRAG_MIME) || event.dataTransfer.getData("text/plain");
      if (!nodeType) {
        return;
      }

      const screenPosition = { x: event.clientX, y: event.clientY };
      const canvasPosition = utils.screenToCanvas(event.clientX, event.clientY);
      onNodeDrop({
        nodeType,
        canvasPosition,
        screenPosition,
      });
    },
    [onNodeDrop, utils],
  );

  // Handle mouse wheel for zoom (Figma style)
  const handleWheel = React.useCallback(
    (e: WheelEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      // Figma style: Ctrl/Cmd + wheel for zoom, otherwise pan
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const center = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        // More responsive zoom with larger delta
        const rawDelta = e.deltaY * -0.01;
        const newScale = applyZoomDelta(canvasState.viewport.scale, rawDelta);

        canvasActions.zoomViewport(newScale, center);
      } else {
        // Normal scroll for panning
        e.preventDefault();

        // Invert deltaX for horizontal scrolling (Figma behavior)
        const deltaX = -e.deltaX;
        const deltaY = -e.deltaY;

        canvasActions.panViewport({ x: deltaX, y: deltaY });
      }
    },
    [canvasState.viewport.scale, canvasActions],
  );

  // Handle panning with middle mouse button or space+drag, and box selection
  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      const pointerType = pointerTypeFromEvent(e);
      const target = e.target as Element | null;
      const interactiveTarget = isInteractiveElement(target);

      if (interactionSettings.pinchZoom.enabled && pinchPointerTypes.has(pointerType)) {
        activePinchPointersRef.current.set(e.pointerId, {
          clientX: e.clientX,
          clientY: e.clientY,
          pointerType,
        });
        if (containerRef.current) {
          containerRef.current.setPointerCapture(e.pointerId);
        }
        if (activePinchPointersRef.current.size === 2 && tryStartPinch()) {
          return;
        }
      }

      if (isPinching) {
        return;
      }

      primaryPointerRef.current = null;

      const nativeEvent = e.nativeEvent;
      const intent = evaluateCanvasPointerIntent({
        event: nativeEvent,
        pointerType,
        interactiveTarget,
        isSpacePanning: canvasState.isSpacePanning,
        panActivators: interactionSettings.canvasPanActivators,
        matchesPointerAction,
      });

      if (intent.canRangeSelect) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }

        const screenX = nativeEvent.clientX - rect.left;
        const screenY = nativeEvent.clientY - rect.top;

        setIsBoxSelecting(true);
        actionActions.setSelectionBox({
          start: { x: screenX, y: screenY },
          end: { x: screenX, y: screenY },
        });

        if (!intent.additiveSelection) {
          actionActions.clearSelection();
        }

        primaryPointerRef.current = {
          pointerId: e.pointerId,
          origin: { x: e.clientX, y: e.clientY },
          intent,
          status: "range-select",
        };

        if (containerRef.current) {
          containerRef.current.setPointerCapture(e.pointerId);
        }
        return;
      }

      if (pointerType !== "mouse" && pointerType !== "pen") {
        return;
      }

      if (intent.canPan && !intent.canClearSelection) {
        e.preventDefault();
        canvasActions.startPan({ x: e.clientX, y: e.clientY });

        primaryPointerRef.current = {
          pointerId: e.pointerId,
          origin: { x: e.clientX, y: e.clientY },
          intent,
          status: "pan",
        };

        if (containerRef.current) {
          containerRef.current.setPointerCapture(e.pointerId);
        }
        return;
      }

      if (intent.canPan || intent.canClearSelection) {
        if (intent.canPan) {
          e.preventDefault();
        }

        primaryPointerRef.current = {
          pointerId: e.pointerId,
          origin: { x: e.clientX, y: e.clientY },
          intent,
          status: "pending",
        };
      }
    },
    [
      interactionSettings.pinchZoom.enabled,
      pinchPointerTypes,
      tryStartPinch,
      isPinching,
      canvasState.isSpacePanning,
      interactionSettings.canvasPanActivators,
      matchesPointerAction,
      canvasActions,
      actionActions,
    ],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      const pointerType = pointerTypeFromEvent(e);

      if (interactionSettings.pinchZoom.enabled && pinchPointerTypes.has(pointerType)) {
        if (activePinchPointersRef.current.has(e.pointerId)) {
          activePinchPointersRef.current.set(e.pointerId, {
            clientX: e.clientX,
            clientY: e.clientY,
            pointerType,
          });
        }
      }

      if (isPinching) {
        e.preventDefault();
        updatePinchZoom();
        return;
      }

      const primaryPointer = primaryPointerRef.current;
      if (primaryPointer && primaryPointer.pointerId === e.pointerId) {
        if (primaryPointer.status === "pending") {
          const currentPosition = { x: e.clientX, y: e.clientY };
          if (primaryPointer.intent.canPan && hasExceededCanvasDragThreshold(primaryPointer.origin, currentPosition)) {
            e.preventDefault();
            canvasActions.startPan(primaryPointer.origin);
            canvasActions.updatePan(currentPosition);
            primaryPointerRef.current = {
              ...primaryPointer,
              status: "pan",
            };
            if (containerRef.current) {
              containerRef.current.setPointerCapture(e.pointerId);
            }
            return;
          }

          if (
            primaryPointer.intent.canClearSelection &&
            hasExceededCanvasDragThreshold(primaryPointer.origin, currentPosition)
          ) {
            primaryPointerRef.current = null;
          }
        } else if (primaryPointer.status === "pan") {
          canvasActions.updatePan({ x: e.clientX, y: e.clientY });
          return;
        }
      }

      if (canvasState.panState.isPanning) {
        canvasActions.updatePan({ x: e.clientX, y: e.clientY });
        return;
      }

      if (isBoxSelecting && actionState.selectionBox) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        actionActions.setSelectionBox({
          start: actionState.selectionBox.start,
          end: { x: screenX, y: screenY },
        });
      }
    },
    [
      interactionSettings.pinchZoom.enabled,
      pinchPointerTypes,
      isPinching,
      updatePinchZoom,
      canvasState.panState.isPanning,
      isBoxSelecting,
      actionState.selectionBox,
      canvasActions,
      actionActions,
    ],
  );

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      const pointerType = pointerTypeFromEvent(e);

      if (interactionSettings.pinchZoom.enabled && pinchPointerTypes.has(pointerType)) {
        if (activePinchPointersRef.current.has(e.pointerId)) {
          activePinchPointersRef.current.delete(e.pointerId);
        }

        if (containerRef.current) {
          containerRef.current.releasePointerCapture(e.pointerId);
        }

        if (activePinchPointersRef.current.size < 2) {
          endPinch();
        }

        if (isPinching) {
          return;
        }
      }

      const primaryPointer = primaryPointerRef.current;
      if (primaryPointer && primaryPointer.pointerId === e.pointerId) {
        if (primaryPointer.status === "pan") {
          canvasActions.endPan();
          primaryPointerRef.current = null;

          if (containerRef.current) {
            containerRef.current.releasePointerCapture(e.pointerId);
          }
          return;
        }

        if (primaryPointer.status === "pending" && primaryPointer.intent.canClearSelection) {
          primaryPointerRef.current = null;
          actionActions.clearSelection();
          return;
        }

        primaryPointerRef.current = null;
      } else if (canvasState.panState.isPanning) {
        canvasActions.endPan();

        if (containerRef.current) {
          containerRef.current.releasePointerCapture(e.pointerId);
        }
        return;
      }

      if (isBoxSelecting && actionState.selectionBox) {
        setIsBoxSelecting(false);

        const { start, end } = actionState.selectionBox;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }

        const canvasStartX = (start.x - canvasState.viewport.offset.x) / canvasState.viewport.scale;
        const canvasStartY = (start.y - canvasState.viewport.offset.y) / canvasState.viewport.scale;
        const canvasEndX = (end.x - canvasState.viewport.offset.x) / canvasState.viewport.scale;
        const canvasEndY = (end.y - canvasState.viewport.offset.y) / canvasState.viewport.scale;

        const minX = Math.min(canvasStartX, canvasEndX);
        const maxX = Math.max(canvasStartX, canvasEndX);
        const minY = Math.min(canvasStartY, canvasEndY);
        const maxY = Math.max(canvasStartY, canvasEndY);

        const selectedNodeIds: string[] = [];
        Object.values(nodeEditorState.nodes).forEach((node) => {
          const nodeWidth = node.size?.width || 150;
          const nodeHeight = node.size?.height || 50;

          const intersects =
            node.position.x < maxX &&
            node.position.x + nodeWidth > minX &&
            node.position.y < maxY &&
            node.position.y + nodeHeight > minY;

          if (intersects) {
            selectedNodeIds.push(node.id);
          }
        });

        if (selectedNodeIds.length > 0) {
          const additiveSelection = matchesPointerAction("node-add-to-selection", e.nativeEvent);
          if (additiveSelection) {
            const newSelection = [...new Set([...actionState.selectedNodeIds, ...selectedNodeIds])];
            actionActions.setInteractionSelection(newSelection);
          } else {
            actionActions.setInteractionSelection(selectedNodeIds);
          }
        }

        actionActions.setSelectionBox(null);

        if (containerRef.current) {
          containerRef.current.releasePointerCapture(e.pointerId);
        }
      }
    },
    [
      interactionSettings.pinchZoom.enabled,
      pinchPointerTypes,
      endPinch,
      isPinching,
      canvasState.panState.isPanning,
      isBoxSelecting,
      actionState.selectionBox,
      actionState.selectedNodeIds,
      nodeEditorState.nodes,
      matchesPointerAction,
      canvasActions,
      actionActions,
    ],
  );

  const handlePointerCancel = React.useCallback(
    (e: React.PointerEvent) => {
      handlePointerUp(e);
    },
    [handlePointerUp],
  );

  // Handle context menu
  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      const nativeEvent = e.nativeEvent as MouseEvent & { pointerType?: string };
      if (!matchesPointerAction("canvas-open-context-menu", nativeEvent)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const pointerType: PointerType | "unknown" =
        nativeEvent.pointerType === "mouse" || nativeEvent.pointerType === "touch" || nativeEvent.pointerType === "pen"
          ? (nativeEvent.pointerType as PointerType)
          : "unknown";

      const screenPosition = { x: e.clientX, y: e.clientY };
      const canvasPosition = utils.screenToCanvas(e.clientX, e.clientY);

      const defaultShow = () => actionActions.showContextMenu(screenPosition, undefined, canvasPosition);

      const handler = interactionSettings.contextMenu.handleRequest;
      if (handler) {
        handler({
          target: { kind: "canvas" },
          screenPosition,
          canvasPosition,
          pointerType,
          event: nativeEvent,
          defaultShow,
        });
        return;
      }

      defaultShow();
    },
    [actionActions, utils, interactionSettings.contextMenu.handleRequest, matchesPointerAction],
  );

  // Handle double click to open Node Search
  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      // Exclude double clicks on nodes
      const target = e.target as Element;
      const isOnNode = target?.closest?.("[data-node-id]");

      if (isOnNode) {
        return;
      }

      // Convert screen coordinates to canvas coordinates using utils
      const canvasPosition = utils.screenToCanvas(e.clientX, e.clientY);
      const position = { x: e.clientX, y: e.clientY };
      actionActions.showContextMenu(position, undefined, canvasPosition, undefined, "search");
    },
    [actionActions, utils],
  );

  // Handle keyboard shortcuts (Figma style)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space for panning mode
      if (e.code === "Space" && !e.repeat && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        canvasActions.setSpacePanning(true);
      }

      // Figma style zoom shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.repeat) {
        switch (e.key) {
          case "0": // Reset zoom to 100%
            e.preventDefault();
            canvasActions.resetViewport();
            break;
          case "1": // Zoom to fit
            e.preventDefault();
            // TODO: Implement zoom to fit
            break;
          case "=":
          case "+": // Zoom in
            e.preventDefault();
            canvasActions.zoomViewport(applyZoomDelta(canvasState.viewport.scale, 1));
            break;
          case "-": // Zoom out
            e.preventDefault();
            canvasActions.zoomViewport(applyZoomDelta(canvasState.viewport.scale, -1));
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        canvasActions.setSpacePanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [canvasActions, canvasState.viewport.scale]);

  // Set up wheel event listener
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const containerClassName = className ? `${styles.canvasContainer} ${className}` : styles.canvasContainer;

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="application"
      aria-label="Node Editor Canvas"
      data-is-panning={canvasState.panState.isPanning}
      data-is-space-panning={canvasState.isSpacePanning}
      data-is-box-selecting={isBoxSelecting}
    >
      {/* Grid background */}
      {canvasState.gridSettings.showGrid && (
        <svg className={styles.gridSvg}>
          {gridPatternDefs}
          <rect width="100%" height="100%" fill={gridPatternFill} />
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

/**
 * Debug notes:
 * - Reviewed src/contexts/NodeCanvasContext.tsx to validate clamping behavior while reworking zoom logic.
 * - Reviewed src/components/layers/GridToolbox.tsx to keep toolbar zoom controls in sync with wheel and keyboard handling.
 * - Reviewed src/contexts/InteractionSettingsContext.tsx and src/utils/pointerShortcuts.ts to confirm pan activator modifiers while addressing pan/range selection conflicts.
 */
