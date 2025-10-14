/**
 * @file Hook for handling pointer interactions with canvas coordinate conversion
 */
import * as React from "react";

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
  React.useEffect(() => {
    if (!interactionState) {
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const canvasPosition = screenToCanvas
        ? screenToCanvas(e.clientX, e.clientY)
        : (() => {
            const element = document.querySelector(canvasSelector);
            if (!element) {
              return { x: e.clientX, y: e.clientY };
            }
            const rect = element.getBoundingClientRect();
            return {
              x: (e.clientX - rect.left - viewport.offset.x) / viewport.scale,
              y: (e.clientY - rect.top - viewport.offset.y) / viewport.scale,
            };
          })();

      onPointerMove(canvasPosition, e);
    };

    const handlePointerUp = (e: PointerEvent) => {
      onPointerUp(e);
    };

    window.addEventListener("pointermove", handlePointerMove, pointerMoveOptions);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [interactionState, viewport, onPointerMove, onPointerUp, canvasSelector, pointerMoveOptions, screenToCanvas]);
}

/*
debug-notes:
- Reviewed src/components/node/NodeLayer.tsx to ensure pointer tracking supplies localized screenToCanvas implementations for nested editors.
- Reviewed src/contexts/NodeCanvasContext.tsx to reuse shared coordinate utilities instead of querying global document nodes.
*/
