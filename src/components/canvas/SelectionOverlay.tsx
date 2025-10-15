/**
 * @file SelectionOverlay component
 */
import * as React from "react";
import { SelectionBox } from "../canvas/SelectionBox";
import styles from "./SelectionOverlay.module.css";

/**
 * SelectionOverlay - Overlay layer for selection visual feedback
 * This layer passes through all pointer events to underlying layers
 */
export const SelectionOverlay: React.FC = () => {
  return (
    <div className={styles.selectionOverlay}>
      <SelectionBox />
    </div>
  );
};

SelectionOverlay.displayName = "SelectionOverlay";
