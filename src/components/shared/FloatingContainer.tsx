import * as React from "react";
import styles from "./FloatingContainer.module.css";

export type FloatingContainerProps = {
  position?: "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | { x: number; y: number };
  className?: string;
  children?: React.ReactNode;
  /** Whether the container can be dragged */
  draggable?: boolean;
  /** Callback when position changes (for draggable containers) */
  onPositionChange?: (position: { x: number; y: number }) => void;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

export const FloatingContainer: React.FC<FloatingContainerProps> = ({
  position = "top",
  className,
  children,
  draggable = false,
  onPositionChange,
  style,
}) => {
  const [customPosition, setCustomPosition] = React.useState<{ x: number; y: number } | null>(
    typeof position === "object" ? position : null
  );
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef<{ x: number; y: number; initialX: number; initialY: number } | null>(null);

  // Handle drag start
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!draggable || typeof position !== "object") {return;}

      setIsDragging(true);
      const currentPos = customPosition || (typeof position === "object" ? position : { x: 0, y: 0 });
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialX: currentPos.x,
        initialY: currentPos.y,
      };
    },
    [draggable, position, customPosition]
  );

  // Handle mouse move
  React.useEffect(() => {
    if (!isDragging) {return;}

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        const newPosition = {
          x: dragStartRef.current.initialX + deltaX,
          y: dragStartRef.current.initialY + deltaY,
        };
        setCustomPosition(newPosition);
        onPositionChange?.(newPosition);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onPositionChange]);

  const containerStyle: React.CSSProperties = {
    ...style,
    ...(typeof position === "object" && {
      left: customPosition?.x ?? position.x,
      top: customPosition?.y ?? position.y,
      transform: "none",
    }),
    cursor: isDragging ? "grabbing" : draggable && typeof position === "object" ? "grab" : undefined,
  };

  return (
    <div
      className={`${styles.floatingContainer} ${className || ""}`}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      data-dragging={isDragging}
      data-position={typeof position === "string" ? position : undefined}
    >
      {children}
    </div>
  );
};