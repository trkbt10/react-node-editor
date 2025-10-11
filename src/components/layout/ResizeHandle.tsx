import * as React from "react";
import styles from "./ResizeHandle.module.css";

export type ResizeHandleProps = {
  /** Direction of resize */
  direction: "horizontal" | "vertical";
  /** Callback when resize occurs */
  onResize?: (delta: number) => void;
  /** Additional className */
  className?: string;
}

/**
 * ResizeHandle - Draggable handle for resizing grid areas
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  direction,
  onResize,
  className,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const startPosRef = React.useRef<number>(0);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startPosRef.current = direction === "horizontal" ? e.clientY : e.clientX;
    },
    [direction]
  );

  React.useEffect(() => {
    if (!isDragging) {return;}

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === "horizontal" ? e.clientY : e.clientX;
      const delta = currentPos - startPosRef.current;

      if (onResize && Math.abs(delta) > 0) {
        onResize(delta);
        startPosRef.current = currentPos;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, direction, onResize]);

  return (
    <div
      className={`${styles.resizeHandle} ${
        direction === "horizontal" ? styles.horizontal : styles.vertical
      } ${isDragging ? styles.dragging : ""} ${className || ""}`}
      onMouseDown={handleMouseDown}
    />
  );
};
