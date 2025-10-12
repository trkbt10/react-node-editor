/**
 * @file Input component
 */
import React from "react";
import styles from "./Input.module.css";

export type InputProps = {
  error?: boolean;
  variant?: "default" | "outline" | "filled";
  label?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, variant = "default", label, className = "", ...props }, ref) => {
    const hasLabel = label !== undefined;
    const containerClasses = [hasLabel ? styles.inputWithLabel : styles.input, className].filter(Boolean).join(" ");

    if (hasLabel) {
      return (
        <div className={containerClasses} data-variant={variant} data-error={error ? "true" : "false"}>
          <span className={styles.inputLabel}>{label}</span>
          <input ref={ref} className={styles.inputElement} {...props} />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={containerClasses}
        data-variant={variant}
        data-error={error ? "true" : "false"}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
