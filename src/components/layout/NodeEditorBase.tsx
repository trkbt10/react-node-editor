/**
 * @file Node editor base component
 */
import * as React from "react";
import { useNodeEditorShortcuts } from "../../hooks/useNodeEditorShortcuts";
import styles from "./NodeEditorBase.module.css";

type NodeEditorBaseProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * NodeEditorBase - The outermost container component for the node editor
 * This component wraps all elements within the editor and provides the basic layout structure
 */
export const NodeEditorBase: React.FC<NodeEditorBaseProps> = ({ children, className, style }) => {
  // Initialize keyboard shortcuts
  useNodeEditorShortcuts();

  const mergedClassName = className ? `${styles.nodeEditorBase} ${className}` : styles.nodeEditorBase;

  return (
    <div
      className={mergedClassName}
      style={style}
      tabIndex={0} // Make focusable for keyboard events
    >
      {children}
    </div>
  );
};

NodeEditorBase.displayName = "NodeEditorBase";
