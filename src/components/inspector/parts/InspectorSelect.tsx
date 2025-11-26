/**
 * @file Inspector select component
 */
import * as React from "react";
import styles from "./InspectorSelect.module.css";

export type InspectorSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const InspectorSelect = React.forwardRef<HTMLSelectElement, InspectorSelectProps>(
  ({ className = "", ...props }, ref) => {
    const classes = [styles.select, className].filter(Boolean).join(" ");
    return <select ref={ref} className={classes} {...props} />;
  },
);

InspectorSelect.displayName = "InspectorSelect";
