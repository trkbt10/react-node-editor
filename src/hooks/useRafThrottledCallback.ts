/**
 * @file Hook for scheduling callbacks at most once per animation frame.
 */
import * as React from "react";

export type RafThrottledCallback<T> = {
  schedule: (value: T, options?: { immediate?: boolean }) => void;
  cancel: () => void;
};

/**
 * Returns helpers that ensure the provided callback runs at most once per animation frame.
 * Subsequent schedules within the same frame coalesce to the latest value. Pass `{ immediate: true }`
 * when the update must run right away (e.g., on drag end).
 */
export function useRafThrottledCallback<T>(callback: (value: T) => void): RafThrottledCallback<T> {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  const frameRef = React.useRef<number | null>(null);
  const pendingRef = React.useRef<T | null>(null);

  const cancel = React.useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingRef.current = null;
  }, []);

  const flushPending = React.useCallback(() => {
    if (pendingRef.current === null) {
      return;
    }
    const value = pendingRef.current;
    pendingRef.current = null;
    callbackRef.current(value);
  }, []);

  const schedule = React.useCallback(
    (value: T, options?: { immediate?: boolean }) => {
      if (options?.immediate) {
        cancel();
        callbackRef.current(value);
        return;
      }

      pendingRef.current = value;
      if (frameRef.current !== null) {
        return;
      }
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        flushPending();
      });
    },
    [cancel, flushPending],
  );

  React.useEffect(() => cancel, [cancel]);

  return {
    schedule,
    cancel,
  };
}
