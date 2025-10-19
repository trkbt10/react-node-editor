/**
 * @file Hook that centralizes canvas pointer event handling with registry-based injections.
 */
import * as React from "react";
import { useNodeCanvas } from "../contexts/NodeCanvasContext";
import { useEditorActionState } from "../contexts/EditorActionStateContext";
import { useNodeEditor } from "../contexts/node-editor/context";
import { useInteractionSettings } from "../contexts/InteractionSettingsContext";
import { usePointerShortcutMatcher } from "./usePointerShortcutMatcher";
import { evaluateCanvasPointerIntent, hasExceededCanvasDragThreshold, normalizePointerType } from "../utils/canvasPointerIntent";
import type { PointerType } from "../types/interaction";
import { useCanvasPointerActionRegistry, type CanvasPointerEventHandlers } from "../contexts/CanvasPointerActionContext";
import { clampZoomScale } from "../utils/zoomUtils";
import { toggleIds } from "../utils/selectionUtils";
import type { NodeId } from "../types/core";

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
      intent: ReturnType<typeof evaluateCanvasPointerIntent>;
      status: "pending" | "pan" | "range-select";
    }
  | null;

export type UseCanvasPointerActionsOptions = {
  containerRef: React.RefObject<HTMLDivElement | null>;
};

export type UseCanvasPointerActionsResult = {
  handlers: CanvasPointerEventHandlers;
  isBoxSelecting: boolean;
};

const PINCH_SCALE_EPSILON = 1e-4;

export const useCanvasPointerActions = ({
  containerRef,
}: UseCanvasPointerActionsOptions): UseCanvasPointerActionsResult => {
  const { state: canvasState, actions: canvasActions } = useNodeCanvas();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: nodeEditorState } = useNodeEditor();
  const interactionSettings = useInteractionSettings();
  const matchesPointerAction = usePointerShortcutMatcher();
  const { applyInjections } = useCanvasPointerActionRegistry();

  const [isBoxSelecting, setIsBoxSelecting] = React.useState(false);
  const [isPinching, setIsPinching] = React.useState(false);
  const primaryPointerRef = React.useRef<PrimaryPointerState>(null);
  const activePinchPointersRef = React.useRef<Map<number, PinchPointer>>(new Map());
  const pinchStateRef = React.useRef<PinchState | null>(null);
  const initialSelectionRef = React.useRef<NodeId[]>([]);

  const pinchPointerTypes = React.useMemo(() => {
    return new Set(interactionSettings.pinchZoom.pointerTypes);
  }, [interactionSettings.pinchZoom.pointerTypes]);
  const pinchMinDistance = interactionSettings.pinchZoom.minDistance ?? 0;

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

    const dx = pointers[1].clientX - pointers[0].clientX;
    const dy = pointers[1].clientY - pointers[0].clientY;
    const distance = Math.hypot(dx, dy);
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
    containerRef,
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

    const dx = pointers[1].clientX - pointers[0].clientX;
    const dy = pointers[1].clientY - pointers[0].clientY;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const center = {
      x: (pointers[0].clientX + pointers[1].clientX) / 2 - rect.left,
      y: (pointers[0].clientY + pointers[1].clientY) / 2 - rect.top,
    };

    const targetScale = clampZoomScale((pinchState.initialScale * distance) / pinchState.initialDistance);

    const scaleDelta = Math.abs(targetScale - pinchState.lastScale);
    if (scaleDelta > PINCH_SCALE_EPSILON) {
      canvasActions.zoomViewport(targetScale, center);
      pinchStateRef.current = {
        ...pinchState,
        lastScale: targetScale,
        center,
      };
      return;
    }

    pinchStateRef.current = {
      ...pinchState,
      center,
    };
  }, [canvasActions, containerRef]);

  const endPinch = React.useCallback(() => {
    if (!isPinching) {
      return;
    }
    setIsPinching(false);
    pinchStateRef.current = null;
  }, [isPinching]);

  const pointerTypeFromEvent = React.useCallback((event: React.PointerEvent): PointerType => {
    return normalizePointerType(event.pointerType);
  }, []);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointerType = pointerTypeFromEvent(e);

      if (interactionSettings.pinchZoom.enabled && pinchPointerTypes.has(pointerType)) {
        activePinchPointersRef.current.set(e.pointerId, {
          clientX: e.clientX,
          clientY: e.clientY,
          pointerType,
        });

        if (activePinchPointersRef.current.size === 2 && tryStartPinch()) {
          const container = containerRef.current;
          if (container) {
            container.setPointerCapture(e.pointerId);
          }
          return;
        }
      }

      if (isPinching) {
        return;
      }

      const target = e.target as Element | null;
      const interactiveTarget = target?.closest?.(
        '[data-node-id], [data-port-id], [data-connection-id], button, input, textarea, [role="button"]',
      );

      const intent = evaluateCanvasPointerIntent({
        event: e.nativeEvent,
        pointerType,
        interactiveTarget: Boolean(interactiveTarget),
        isSpacePanning: canvasState.isSpacePanning,
        panActivators: interactionSettings.canvasPanActivators,
        matchesPointerAction,
      });

      if (intent.canRangeSelect) {
        e.preventDefault();
        e.stopPropagation();

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const start = { x: screenX, y: screenY };

        setIsBoxSelecting(true);
        actionActions.setSelectionBox({ start, end: start });
        if (intent.additiveSelection) {
          initialSelectionRef.current = actionState.selectedNodeIds.slice();
        } else {
          initialSelectionRef.current = [];
          actionActions.clearSelection();
        }

        primaryPointerRef.current = {
          pointerId: e.pointerId,
          origin: { x: e.clientX, y: e.clientY },
          intent,
          status: "range-select",
        };

        const container = containerRef.current;
        if (container) {
          container.setPointerCapture(e.pointerId);
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

        const container = containerRef.current;
        if (container) {
          container.setPointerCapture(e.pointerId);
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
      pointerTypeFromEvent,
      interactionSettings.pinchZoom.enabled,
      pinchPointerTypes,
      tryStartPinch,
      isPinching,
      canvasState.isSpacePanning,
      interactionSettings.canvasPanActivators,
      matchesPointerAction,
      canvasActions,
      containerRef,
      actionActions,
      actionState.selectedNodeIds,
    ],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
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

            const container = containerRef.current;
            if (container) {
              container.setPointerCapture(e.pointerId);
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
      pointerTypeFromEvent,
      interactionSettings.pinchZoom.enabled,
      pinchPointerTypes,
      isPinching,
      updatePinchZoom,
      canvasState.panState.isPanning,
      isBoxSelecting,
      actionState.selectionBox,
      canvasActions,
      actionActions,
      containerRef,
    ],
  );

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointerType = pointerTypeFromEvent(e);

      if (interactionSettings.pinchZoom.enabled && pinchPointerTypes.has(pointerType)) {
        if (activePinchPointersRef.current.has(e.pointerId)) {
          activePinchPointersRef.current.delete(e.pointerId);
        }

        const container = containerRef.current;
        if (container) {
          container.releasePointerCapture(e.pointerId);
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

          const container = containerRef.current;
          if (container) {
            container.releasePointerCapture(e.pointerId);
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

        const container = containerRef.current;
        if (container) {
          container.releasePointerCapture(e.pointerId);
        }
        return;
      }

      if (isBoxSelecting && actionState.selectionBox) {
        setIsBoxSelecting(false);

        const { start, end } = actionState.selectionBox;
        const canvasStartX = (start.x - canvasState.viewport.offset.x) / canvasState.viewport.scale;
        const canvasStartY = (start.y - canvasState.viewport.offset.y) / canvasState.viewport.scale;
        const canvasEndX = (end.x - canvasState.viewport.offset.x) / canvasState.viewport.scale;
        const canvasEndY = (end.y - canvasState.viewport.offset.y) / canvasState.viewport.scale;

        const minX = Math.min(canvasStartX, canvasEndX);
        const maxX = Math.max(canvasStartX, canvasEndX);
        const minY = Math.min(canvasStartY, canvasEndY);
        const maxY = Math.max(canvasStartY, canvasEndY);

        const nodesInBox: NodeId[] = [];
        Object.values(nodeEditorState.nodes).forEach((node) => {
          const nodeWidth = node.size?.width ?? 150;
          const nodeHeight = node.size?.height ?? 50;

          const intersects =
            node.position.x < maxX &&
            node.position.x + nodeWidth > minX &&
            node.position.y < maxY &&
            node.position.y + nodeHeight > minY;

          if (intersects) {
            nodesInBox.push(node.id);
          }
        });

        const additiveSelection = matchesPointerAction("node-add-to-selection", e.nativeEvent);
        const uniqueNodeIds = Array.from(new Set(nodesInBox));

        if (additiveSelection) {
          const baseSelection = initialSelectionRef.current.length > 0
            ? initialSelectionRef.current
            : actionState.selectedNodeIds;
          const toggled = toggleIds(baseSelection, uniqueNodeIds);
          actionActions.setInteractionSelection(toggled);
          actionActions.setEditingSelection(toggled);
        } else if (uniqueNodeIds.length > 0) {
          actionActions.setInteractionSelection(uniqueNodeIds);
          actionActions.setEditingSelection(uniqueNodeIds);
        } else {
          actionActions.clearSelection();
        }

        actionActions.setSelectionBox(null);
        initialSelectionRef.current = [];

        const container = containerRef.current;
        if (container) {
          container.releasePointerCapture(e.pointerId);
        }
      }
    },
    [
      pointerTypeFromEvent,
      interactionSettings.pinchZoom.enabled,
      pinchPointerTypes,
      endPinch,
      isPinching,
      canvasState.panState.isPanning,
      isBoxSelecting,
      actionState.selectionBox,
      nodeEditorState.nodes,
      matchesPointerAction,
      canvasState.viewport.offset.x,
      canvasState.viewport.offset.y,
      canvasState.viewport.scale,
      canvasActions,
      actionActions,
      containerRef,
      actionState.selectedNodeIds,
    ],
  );

  const handlePointerCancel = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      handlePointerUp(e);
    },
    [handlePointerUp],
  );

  const baseHandlers = React.useMemo<CanvasPointerEventHandlers>(
    () => ({
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    }),
    [handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel],
  );

  const handlers = React.useMemo(() => applyInjections(baseHandlers), [applyInjections, baseHandlers]);

  return {
    handlers,
    isBoxSelecting,
  };
};

/*
debug-notes:
- Studied src/components/canvas/CanvasBase.tsx to migrate pointer state management into a dedicated hook while preserving selection and pan behaviors.
- Reviewed src/utils/canvasPointerIntent.ts to ensure intent evaluation semantics remain intact during the refactor.
- Consulted src/hooks/usePointerShortcutMatcher.ts to keep shortcut matching consistent when exposing handlers through the registry.
*/
