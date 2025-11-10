/**
 * @file Hook for handling pointer interactions with canvas coordinate conversion
 */
import * as React from "react";
import { useRafThrottledCallback } from "./useRafThrottledCallback";

type EffectEventHook = <Args extends unknown[], Return>(
  handler: (...args: Args) => Return,
) => (...args: Args) => Return;

const useEffectEventInternal: EffectEventHook =
  (React as typeof React & { useEffectEvent?: EffectEventHook }).useEffectEvent ?? ((handler) => handler);

export type PointerInteractionConfig<T> = {
  /**
   * The state that triggers the interaction
   */
  interactionState: T | null | undefined;

  /**
   * Canvas viewport configuration
   */
  viewport: {
    offset: { x: number; y: number };
    scale: number;
  };

  /**
   * Optional converter that maps screen coordinates to canvas coordinates.
   * When provided, viewport and canvasSelector are ignored for coordinate conversion.
   */
  screenToCanvas?: (screenX: number, screenY: number) => { x: number; y: number };

  /**
   * Callback for pointer move events with canvas coordinates
   */
  onPointerMove: (canvasPosition: { x: number; y: number }, event: PointerEvent) => void;

  /**
   * Callback for pointer up events
   */
  onPointerUp: (event: PointerEvent) => void;

  /**
   * Optional selector for the canvas element (defaults to '[role="application"]')
   */
  canvasSelector?: string;

  /**
   * Optional configuration for pointer move event listener
   */
  pointerMoveOptions?: AddEventListenerOptions;
};

type PointerMovePayload = {
  canvasPosition: { x: number; y: number };
  event: PointerEvent;
};

/**
 * Custom hook for handling pointer interactions on the canvas
 * Provides abstracted pointer tracking with automatic canvas coordinate conversion
 */
export function usePointerInteraction<T>({
  interactionState,
  viewport,
  onPointerMove,
  onPointerUp,
  canvasSelector = '[role="application"]',
  pointerMoveOptions = { passive: true },
  screenToCanvas,
}: PointerInteractionConfig<T>): void {
  const emitPointerMove = useEffectEventInternal((payload: PointerMovePayload) => {
    onPointerMove(payload.canvasPosition, payload.event);
  });
  const emitPointerUp = useEffectEventInternal(onPointerUp);

  const { schedule: schedulePointerMove, cancel: cancelPointerMove } = useRafThrottledCallback<PointerMovePayload>(
    emitPointerMove,
  );
  const schedulePointerMoveRef = React.useRef(schedulePointerMove);
  const cancelPointerMoveRef = React.useRef(cancelPointerMove);
  schedulePointerMoveRef.current = schedulePointerMove;
  cancelPointerMoveRef.current = cancelPointerMove;

  React.useEffect(() => {
    if (!interactionState) {
      return;
    }

    const toCanvasPosition = (event: PointerEvent) => {
      if (screenToCanvas) {
        return screenToCanvas(event.clientX, event.clientY);
      }
      const element = document.querySelector(canvasSelector);
      if (!element) {
        return { x: event.clientX, y: event.clientY };
      }
      const rect = element.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left - viewport.offset.x) / viewport.scale,
        y: (event.clientY - rect.top - viewport.offset.y) / viewport.scale,
      };
    };

    const handlePointerMove = (e: PointerEvent) => {
      schedulePointerMoveRef.current({ canvasPosition: toCanvasPosition(e), event: e });
    };

    const handlePointerUp = (e: PointerEvent) => {
      schedulePointerMoveRef.current({ canvasPosition: toCanvasPosition(e), event: e }, { immediate: true });
      emitPointerUp(e);
    };

    window.addEventListener("pointermove", handlePointerMove, pointerMoveOptions);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    window.addEventListener("pointercancel", handlePointerUp, { once: true });

    return () => {
      cancelPointerMoveRef.current();
      window.removeEventListener("pointermove", handlePointerMove, pointerMoveOptions);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [
    interactionState,
    viewport,
    canvasSelector,
    pointerMoveOptions,
    screenToCanvas,
  ]);
}

/*
debug-notes:
- Reviewed src/components/node/NodeLayer.tsx to ensure pointer tracking supplies localized screenToCanvas implementations for nested editors.
- Reviewed src/contexts/NodeCanvasContext.tsx to reuse shared coordinate utilities instead of querying global document nodes.
*/
