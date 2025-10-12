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
  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const { onMove, onUp, onCancel } = handlers;

    // Add event listeners
    if (onMove) {
      document.addEventListener("pointermove", onMove, { passive: false });
    }
    if (onUp) {
      document.addEventListener("pointerup", onUp);
    }
    if (onCancel) {
      document.addEventListener("pointercancel", onCancel);
    }

    // Cleanup function
    return () => {
      if (onMove) {
        document.removeEventListener("pointermove", onMove);
      }
      if (onUp) {
        document.removeEventListener("pointerup", onUp);
      }
      if (onCancel) {
        document.removeEventListener("pointercancel", onCancel);
      }
    };
  }, [enabled, handlers.onMove, handlers.onUp, handlers.onCancel]);
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

/**
 * Hook for preventing default pointer events during operations
 * Useful for preventing text selection, context menus, etc. during drag operations
 */
export function usePreventPointerDefaults(
  elementRef: React.RefObject<HTMLElement>,
  enabled: boolean,
  events: string[] = ["pointerdown", "pointermove", "pointerup"],
) {
  React.useEffect(() => {
    const element = elementRef.current;
    if (!enabled || !element) {
      return;
    }

    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    // Add listeners
    events.forEach((eventType) => {
      element.addEventListener(eventType, preventDefault, { passive: false });
    });

    // Cleanup
    return () => {
      events.forEach((eventType) => {
        element.removeEventListener(eventType, preventDefault);
      });
    };
  }, [elementRef, enabled, events]);
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
