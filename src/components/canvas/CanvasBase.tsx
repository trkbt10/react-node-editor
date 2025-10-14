/**
 * @file CanvasBase component
 */
import * as React from "react";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { classNames } from "../elements/classNames";
import { applyZoomDelta, clampZoomScale } from "../../utils/zoomUtils";
import { SelectionOverlay } from "./SelectionOverlay";
import styles from "./CanvasBase.module.css";
import { useInteractionSettings } from "../../contexts/InteractionSettingsContext";
import type { CanvasPanActivator, ModifierKey, PointerType } from "../../types/interaction";

export type CanvasBaseProps = {
  children: React.ReactNode;
  className?: string;
  showGrid?: boolean;
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

const INTERACTIVE_TARGET_SELECTOR =
  '[data-node-id], [data-port-id], [data-connection-id], button, input, textarea, [role="button"]';

const PINCH_SCALE_EPSILON = 1e-4;

const pointerTypeFromEvent = (event: React.PointerEvent): PointerType => {
  const type = event.pointerType;
  if (type === "mouse" || type === "touch" || type === "pen") {
    return type;
  }
  return "mouse";
};

const isInteractiveElement = (target: Element | null): boolean => {
  return Boolean(target?.closest?.(INTERACTIVE_TARGET_SELECTOR));
};

const matchesPanActivator = (
  event: React.PointerEvent,
  activator: CanvasPanActivator,
  pointerType: PointerType,
  interactiveTarget: boolean,
): boolean => {
  if (!activator.pointerTypes.includes(pointerType)) {
    return false;
  }

  if (activator.buttons && !activator.buttons.includes(event.button)) {
    return false;
  }

  if (activator.requireEmptyTarget && interactiveTarget) {
    return false;
  }

  if (activator.modifiers) {
    const modifierKeys = Object.keys(activator.modifiers) as ModifierKey[];
    for (const key of modifierKeys) {
      const required = activator.modifiers[key];
      if (required === undefined) {
        continue;
      }
      if (required && !event[key]) {
        return false;
      }
      if (!required && event[key]) {
        return false;
      }
    }
  }

  return true;
};

const distanceBetween = (a: PinchPointer, b: PinchPointer): number => {
  const dx = b.clientX - a.clientX;
  const dy = b.clientY - a.clientY;
  return Math.hypot(dx, dy);
};

/**
 * CanvasBase - The lowest layer component that handles pan, zoom, and drag operations
 * This component receives events and provides visual support with grid display
 * Does not trap events unless necessary for its own operations
 */
export const CanvasBase: React.FC<CanvasBaseProps> = ({ children, className }) => {
  const { state: canvasState, actions: canvasActions, canvasRef, utils, setContainerElement } = useNodeCanvas();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: nodeEditorState } = useNodeEditor();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rawGridPatternId = React.useId();
  const gridPatternId = React.useMemo(() => rawGridPatternId.replace(/[^a-zA-Z0-9_-]/g, "_"), [rawGridPatternId]);
  const [isBoxSelecting, setIsBoxSelecting] = React.useState(false);
  const interactionSettings = useInteractionSettings();
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

      const shouldPan =
        canvasState.isSpacePanning ||
        interactionSettings.canvasPanActivators.some((activator) =>
          matchesPanActivator(e, activator, pointerType, interactiveTarget),
        );

      if (shouldPan) {
        e.preventDefault();
        canvasActions.startPan({ x: e.clientX, y: e.clientY });

        if (containerRef.current) {
          containerRef.current.setPointerCapture(e.pointerId);
        }
        return;
      }

      if (pointerType !== "mouse" && pointerType !== "pen") {
        return;
      }

      if (e.button === 0 && !interactiveTarget) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        setIsBoxSelecting(true);
        actionActions.setSelectionBox({
          start: { x: screenX, y: screenY },
          end: { x: screenX, y: screenY },
        });

        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          actionActions.clearSelection();
        }

        if (containerRef.current) {
          containerRef.current.setPointerCapture(e.pointerId);
        }
      }
    },
    [
      interactionSettings.pinchZoom.enabled,
      pinchPointerTypes,
      tryStartPinch,
      isPinching,
      canvasState.isSpacePanning,
      interactionSettings.canvasPanActivators,
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

      if (canvasState.panState.isPanning) {
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
          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            const newSelection = [...new Set([...actionState.selectedNodeIds, ...selectedNodeIds])];
            actionActions.selectAllNodes(newSelection);
          } else {
            actionActions.selectAllNodes(selectedNodeIds);
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
      e.preventDefault();
      e.stopPropagation();

      const nativeEvent = e.nativeEvent as MouseEvent & { pointerType?: string };
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
    [actionActions, utils, interactionSettings.contextMenu.handleRequest],
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
      onPointerCancel={handlePointerCancel}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      role="application"
      aria-label="Node Editor Canvas"
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
 */
