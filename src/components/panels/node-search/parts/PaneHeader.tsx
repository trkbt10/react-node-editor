/**
 * @file Shared pane header component for consistent styling across panes
 */
import * as React from "react";
import styles from "./PaneHeader.module.css";

export type PaneHeaderProps = {
  children: React.ReactNode;
};

export const PaneHeader: React.FC<PaneHeaderProps> = ({ children }) => {
  return <div className={styles.paneHeader}>{children}</div>;
};

PaneHeader.displayName = "PaneHeader";
