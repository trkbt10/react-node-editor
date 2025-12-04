/**
 * @file Node editor base component
 */
import * as React from "react";
import { useNodeEditorShortcuts } from "../../contexts/composed/keyboard-shortcut/hooks/useNodeEditorShortcuts";
import styles from "./NodeEditorBase.module.css";

type NodeEditorBaseProps = {
  children: React.ReactNode;
};

/**
 * NodeEditorBase - The outermost container component for the node editor
 * This component wraps all elements within the editor and provides the basic layout structure
 */
export const NodeEditorBase: React.FC<NodeEditorBaseProps> = React.memo(({ children }) => {
  // Initialize keyboard shortcuts
  useNodeEditorShortcuts();

  return (
    <div
      className={styles.nodeEditorBase}
      tabIndex={0} // Make focusable for keyboard events
    >
      {children}
    </div>
  );
});

NodeEditorBase.displayName = "NodeEditorBase";
