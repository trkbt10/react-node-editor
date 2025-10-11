import * as React from "react";
import { Position } from "../types/core";

export type PointerDragOptions<T = unknown> = {
  onStart?: (event: PointerEvent, data: T) => void;
  onMove?: (event: PointerEvent, delta: Position, data: T) => void;
  onEnd?: (event: PointerEvent, delta: Position, data: T) => void;
  scale?: number;
  threshold?: number;
  disabled?: boolean;
}

export type PointerDragState = {
  isDragging: boolean;
  dragStarted: boolean;
  delta: Position;
}

/**
 * Generic hook for handling pointer drag operations
 * Consolidates drag logic used across nodes, connections, and resize operations
 */
export function usePointerDrag<T = unknown>(
  options: PointerDragOptions<T>
): {
  startDrag: (event: React.PointerEvent | PointerEvent, data: T) => void;
  dragState: PointerDragState;
} {
  const {
    onStart,
    onMove,
    onEnd,
    scale = 1,
    threshold = 2,
    disabled = false,
  } = options;

  const [dragState, setDragState] = React.useState<PointerDragState>({
    isDragging: false,
    dragStarted: false,
    delta: { x: 0, y: 0 },
  });

  const dragDataRef = React.useRef<T | null>(null);
  const startPositionRef = React.useRef<Position>({ x: 0, y: 0 });
  const currentDeltaRef = React.useRef<Position>({ x: 0, y: 0 });

  const handlePointerMove = React.useCallback(
    (event: PointerEvent) => {
      if (!dragDataRef.current) {return;}

      const delta = {
        x: (event.clientX - startPositionRef.current.x) / scale,
        y: (event.clientY - startPositionRef.current.y) / scale,
      };

      currentDeltaRef.current = delta;

      // Check if we've moved past the threshold
      if (!dragState.dragStarted) {
        const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        if (distance >= threshold) {
          setDragState({
            isDragging: true,
            dragStarted: true,
            delta,
          });
          onStart?.(event, dragDataRef.current);
        }
      } else {
        setDragState(prev => ({ ...prev, delta }));
        onMove?.(event, delta, dragDataRef.current);
      }
    },
    [scale, threshold, dragState.dragStarted, onStart, onMove]
  );

  const handlePointerUp = React.useCallback(
    (event: PointerEvent) => {
      if (!dragDataRef.current) {return;}

      const wasDragging = dragState.dragStarted;
      const finalDelta = currentDeltaRef.current;

      // Clean up state
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);

      // Reset state
      setDragState({
        isDragging: false,
        dragStarted: false,
        delta: { x: 0, y: 0 },
      });

      // Call onEnd only if we actually started dragging
      if (wasDragging) {
        onEnd?.(event, finalDelta, dragDataRef.current);
      }

      dragDataRef.current = null;
      currentDeltaRef.current = { x: 0, y: 0 };
    },
    [dragState.dragStarted, handlePointerMove, onEnd]
  );

  const startDrag = React.useCallback(
    (event: React.PointerEvent | PointerEvent, data: T) => {
      if (disabled) {return;}

      // Convert React event to native event if needed
      const nativeEvent = "nativeEvent" in event ? event.nativeEvent : event;

      dragDataRef.current = data;
      startPositionRef.current = {
        x: nativeEvent.clientX,
        y: nativeEvent.clientY,
      };

      // Set pointer capture if available
      const target = nativeEvent.target as HTMLElement;
      if (target?.setPointerCapture) {
        target.setPointerCapture(nativeEvent.pointerId);
      }

      // Add event listeners
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("pointercancel", handlePointerUp);

      setDragState({
        isDragging: true,
        dragStarted: false,
        delta: { x: 0, y: 0 },
      });
    },
    [disabled, handlePointerMove, handlePointerUp]
  );

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    startDrag,
    dragState,
  };
}