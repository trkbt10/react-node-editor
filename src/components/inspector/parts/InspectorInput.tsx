/**
 * @file Inspector input component with optional label (text or icon)
 */
import * as React from "react";
import styles from "./InspectorInput.module.css";

export type InspectorInputProps = {
  /** Label content - can be text or an icon */
  label?: React.ReactNode;
  /** Error state */
  error?: boolean;
  /** Visual variant */
  variant?: "default" | "outline" | "filled";
  /** Test ID for testing */
  "data-testid"?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "label">;

/**
 * An input component for inspector panels.
 * Supports optional label (text or icon) displayed inline.
 * Does not include external layout - layout should be controlled externally.
 */
export const InspectorInput = React.forwardRef<HTMLInputElement, InspectorInputProps>(
  ({ label, error = false, variant = "default", className, disabled, "data-testid": dataTestId, ...props }, ref) => {
    const hasLabel = label !== undefined;
    const containerClasses = [hasLabel ? styles.inputWithLabel : styles.input, className].filter(Boolean).join(" ");

    if (hasLabel) {
      return (
        <div
          className={containerClasses}
          data-variant={variant}
          data-error={error ? "true" : undefined}
          data-disabled={disabled ? "true" : undefined}
          data-testid={dataTestId}
        >
          <span className={styles.label}>{label}</span>
          <input ref={ref} className={styles.inputElement} disabled={disabled} {...props} />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={containerClasses}
        data-variant={variant}
        data-error={error ? "true" : undefined}
        disabled={disabled}
        data-testid={dataTestId}
        {...props}
      />
    );
  },
);

InspectorInput.displayName = "InspectorInput";
