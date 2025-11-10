/**
 * @file Hooks for managing document-level pointer events with proper cleanup
 */
import * as React from "react";

export type UseDocumentPointerEventsOptions = {
  onMove?: (e: PointerEvent) => void;
  onUp?: (e: PointerEvent) => void;
  onCancel?: (e: PointerEvent) => void;
};

/**
 * Custom hook for managing document-level pointer events with proper cleanup
 * This pattern is commonly used for drag operations that need to continue
 * even when the pointer moves outside the original element
 */
export function useDocumentPointerEvents(enabled: boolean, handlers: UseDocumentPointerEventsOptions) {
  // Wrap handlers with useEffectEvent to avoid re-registering listeners on handler changes
  // useEffectEvent creates stable function references that always call the latest handlers
  const handleMove = React.useEffectEvent((e: PointerEvent) => {
    handlers.onMove?.(e);
  });

  const handleUp = React.useEffectEvent((e: PointerEvent) => {
    handlers.onUp?.(e);
  });

  const handleCancel = React.useEffectEvent((e: PointerEvent) => {
    handlers.onCancel?.(e);
  });

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    // Add event listeners with stable event handlers
    // Always register all listeners - useEffectEvent handles undefined handlers internally
    document.addEventListener("pointermove", handleMove, { passive: false });
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleCancel);

    // Cleanup function
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleCancel);
    };
  }, [enabled]);
}

/**
 * Hook for capturing pointer during drag operations
 * This ensures that pointer events are delivered to the capturing element
 * even when the pointer moves outside its boundaries
 */
export function usePointerCapture(elementRef: React.RefObject<HTMLElement>, enabled: boolean, pointerId?: number) {
  React.useEffect(() => {
    const element = elementRef.current;
    if (!enabled || !element || pointerId === undefined) {
      return;
    }

    // Capture pointer
    element.setPointerCapture(pointerId);

    // Release capture on cleanup
    return () => {
      if (element.hasPointerCapture && element.hasPointerCapture(pointerId)) {
        element.releasePointerCapture(pointerId);
      }
    };
  }, [elementRef, enabled, pointerId]);
}

const DEFAULT_PREVENT_EVENTS = ["pointerdown", "pointermove", "pointerup"];

/**
 * Hook for preventing default pointer events during operations
 * Useful for preventing text selection, context menus, etc. during drag operations
 */
export function usePreventPointerDefaults(
  elementRef: React.RefObject<HTMLElement>,
  enabled: boolean,
  events: string[] = DEFAULT_PREVENT_EVENTS,
) {
  // Serialize events array to stable string key
  const eventsKey = events.join(",");

  React.useEffect(() => {
    const element = elementRef.current;
    if (!enabled || !element) {
      return;
    }

    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    // Parse eventsKey back to array to avoid stale closure over events array
    const eventTypes = eventsKey.split(",");

    // Add listeners
    eventTypes.forEach((eventType) => {
      element.addEventListener(eventType, preventDefault, { passive: false });
    });

    // Cleanup
    return () => {
      eventTypes.forEach((eventType) => {
        element.removeEventListener(eventType, preventDefault);
      });
    };
  }, [elementRef, enabled, eventsKey]);
}

/**
 * Hook that combines multiple pointer event patterns for drag operations
 */
export function useDragPointerEvents(
  elementRef: React.RefObject<HTMLElement>,
  enabled: boolean,
  options: {
    onMove?: (e: PointerEvent) => void;
    onUp?: (e: PointerEvent) => void;
    onCancel?: (e: PointerEvent) => void;
    pointerId?: number;
    capturePointer?: boolean;
    preventDefaults?: boolean;
  },
) {
  const { onMove, onUp, onCancel, pointerId, capturePointer = true, preventDefaults = true } = options;

  // Document-level event handlers
  useDocumentPointerEvents(enabled, { onMove, onUp, onCancel });

  // Pointer capture
  usePointerCapture(elementRef, enabled && capturePointer, pointerId);

  // Prevent defaults
  usePreventPointerDefaults(elementRef, enabled && preventDefaults);
}
