/**
 * @file Inspector select component
 */
import * as React from "react";
import styles from "./InspectorSelect.module.css";

export type InspectorSelectProps = {
  /** Error state */
  error?: boolean;
  /** Visual variant */
  variant?: "default" | "outline" | "filled";
} & React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * A select dropdown for inspector panels.
 * Styled to match InspectorInput and other inspector form components.
 * Does not include external layout - layout should be controlled externally.
 */
export const InspectorSelect = React.forwardRef<HTMLSelectElement, InspectorSelectProps>(
  ({ className, error = false, variant = "default", disabled, ...props }, ref) => {
    const classes = [styles.select, className].filter(Boolean).join(" ");
    return (
      <select
        ref={ref}
        className={classes}
        data-variant={variant}
        data-error={error ? "true" : undefined}
        disabled={disabled}
        {...props}
      />
    );
  },
);

InspectorSelect.displayName = "InspectorSelect";
