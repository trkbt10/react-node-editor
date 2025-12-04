/**
 * @file SelectionBox component
 */
import * as React from "react";
import { useCanvasInteractionState } from "../../contexts/composed/canvas/interaction/context";
import styles from "./SelectionBox.module.css";

/**
 * SelectionBox - Renders the selection box during box selection in overlay layer
 * This component is purely visual and does not handle events
 */
export const SelectionBox: React.FC = () => {
  const interactionState = useCanvasInteractionState();

  if (!interactionState.selectionBox) {
    return null;
  }

  const { start, end } = interactionState.selectionBox;

  // Calculate box dimensions
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      className={styles.selectionBoxOverlay}
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
};

SelectionBox.displayName = "SelectionBox";
