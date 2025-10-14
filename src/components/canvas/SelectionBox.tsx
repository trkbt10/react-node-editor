/**
 * @file SelectionBox component
 */
import * as React from "react";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { classNames } from "../elements/classNames";
import styles from "./SelectionBox.module.css";

export type SelectionBoxProps = {
  className?: string;
};

/**
 * SelectionBox - Renders the selection box during box selection in overlay layer
 * This component is purely visual and does not handle events
 */
export const SelectionBox: React.FC<SelectionBoxProps> = ({ className }) => {
  const { state: actionState } = useEditorActionState();

  if (!actionState.selectionBox) {
    return null;
  }

  const { start, end } = actionState.selectionBox;

  // Calculate box dimensions
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      className={classNames(styles.selectionBoxOverlay, className)}
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
