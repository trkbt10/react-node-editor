/**
 * @file Horizontal divider component
 */
import * as React from "react";
import styles from "./HorizontalDivider.module.css";

export type HorizontalDividerProps = {
  onResize: (deltaX: number) => void;
  className?: string;
}

export const HorizontalDivider: React.FC<HorizontalDividerProps> = ({
  onResize,
  className
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const lastXRef = React.useRef<number>(0);

  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    lastXRef.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = React.useCallback((e: React.PointerEvent) => {
    if (!isDragging) {return;}
    
    const deltaX = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    onResize(deltaX);
  }, [isDragging, onResize]);

  const handlePointerUp = React.useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      className={`${styles.horizontalDivider} ${className || ""} ${isDragging ? styles.dragging : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
};