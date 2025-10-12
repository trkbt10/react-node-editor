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
}: PointerInteractionConfig<T>): void {
  React.useEffect(() => {
    if (!interactionState) {
      return;
    }

    const canvasElement = document.querySelector(canvasSelector);
    if (!canvasElement) {
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvasElement.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - viewport.offset.x) / viewport.scale;
      const canvasY = (e.clientY - rect.top - viewport.offset.y) / viewport.scale;

      onPointerMove({ x: canvasX, y: canvasY }, e);
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
  }, [interactionState, viewport, onPointerMove, onPointerUp, canvasSelector, pointerMoveOptions]);
}
