import * as React from "react";

type UpdateFunction<T> = (prevState: T) => T;
type BatchedUpdate<T> = T | UpdateFunction<T>;

type BatchedUpdatesOptions = {
  delay?: number;
  maxBatchSize?: number;
};

/**
 * Hook for batching multiple state updates to reduce re-renders
 * Uses requestAnimationFrame for optimal performance
 */
export const useBatchedUpdates = <T>(
  initialState: T,
  options: BatchedUpdatesOptions = {},
): [T, (update: BatchedUpdate<T>) => void, () => void] => {
  const { delay = 0, maxBatchSize = 100 } = options;

  const [state, setState] = React.useState<T>(initialState);
  const pendingUpdates = React.useRef<Array<UpdateFunction<T>>>([]);
  const frameRef = React.useRef<number | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Apply all pending updates
  const flushUpdates = React.useCallback(() => {
    if (pendingUpdates.current.length === 0) {
      return;
    }

    setState((prevState) => {
      let newState = prevState;
      for (const update of pendingUpdates.current) {
        newState = update(newState);
      }
      return newState;
    });

    pendingUpdates.current = [];
    frameRef.current = null;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Schedule update batch
  const scheduleUpdate = React.useCallback(
    (update: BatchedUpdate<T>) => {
      const updateFn: UpdateFunction<T> =
        typeof update === "function" ? (update as UpdateFunction<T>) : (_prevState: T) => update;

      pendingUpdates.current.push(updateFn);

      // If we've reached max batch size, flush immediately
      if (pendingUpdates.current.length >= maxBatchSize) {
        flushUpdates();
        return;
      }

      // Cancel any existing scheduled flush
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      // Schedule flush
      if (delay > 0) {
        // Use timeout for delayed batching
        timeoutRef.current = setTimeout(() => {
          frameRef.current = requestAnimationFrame(flushUpdates);
        }, delay);
      } else {
        // Use next animation frame for immediate batching
        frameRef.current = requestAnimationFrame(flushUpdates);
      }
    },
    [flushUpdates, delay, maxBatchSize],
  );

  // Force flush all pending updates
  const forceFlush = React.useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    flushUpdates();
  }, [flushUpdates]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, scheduleUpdate, forceFlush];
};
