/**
 * @file Inspector label component
 */
import * as React from "react";
import styles from "./InspectorLabel.module.css";

export type InspectorLabelProps = {} & React.HTMLAttributes<HTMLDivElement>;

export const InspectorLabel: React.FC<InspectorLabelProps> = ({ children, className, ...rest }) => {
  return (
    <div className={[styles.label, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
};

InspectorLabel.displayName = "InspectorLabel";
