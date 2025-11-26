/**
 * @file Resize handle component
 */
import * as React from "react";
import styles from "./ResizeHandle.module.css";

export type ResizeHandleProps = {
  /** Direction of resize */
  direction: "horizontal" | "vertical";
  /** Callback when resize occurs */
  onResize?: (delta: number) => void;
};

/**
 * ResizeHandle - Draggable handle for resizing grid areas
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = React.memo(({
  direction,
  onResize,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const startPosRef = React.useRef<number>(0);

  // Use useEffectEvent to avoid re-registering listeners when callbacks change
  const handleResize = React.useEffectEvent((delta: number) => {
    onResize?.(delta);
  });

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startPosRef.current = direction === "horizontal" ? e.clientY : e.clientX;
    },
    [direction],
  );

  React.useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const currentPos = direction === "horizontal" ? e.clientY : e.clientX;
      const delta = currentPos - startPosRef.current;

      if (Math.abs(delta) > 0) {
        handleResize(delta);
        startPosRef.current = currentPos;
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, direction]);

  return (
    <div
      className={styles.resizeHandle}
      data-resize-handle="true"
      data-direction={direction}
      data-dragging={isDragging || undefined}
      onPointerDown={handlePointerDown}
    />
  );
});

ResizeHandle.displayName = "ResizeHandle";
