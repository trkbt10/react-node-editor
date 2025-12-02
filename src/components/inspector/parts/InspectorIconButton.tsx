/**
 * @file Inspector icon button component for minimal icon-only actions
 */
import * as React from "react";
import styles from "./InspectorIconButton.module.css";

export type InspectorIconButtonProps = {
  /** Icon element to display */
  icon: React.ReactNode;
  /** Size variant */
  size?: "default" | "small";
  /** Whether button is in active/pressed state */
  active?: boolean;
  /** Accessible label for the button */
  "aria-label": string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/**
 * A minimal icon button for inspector panels.
 * Does not include layout styling - layout should be controlled externally.
 */
export const InspectorIconButton = React.forwardRef<HTMLButtonElement, InspectorIconButtonProps>(
  ({ icon, size = "default", active = false, className, disabled, ...props }, ref) => {
    const classes = [styles.button, className].filter(Boolean).join(" ");

    return (
      <button
        ref={ref}
        type="button"
        className={classes}
        data-size={size}
        data-active={active ? "true" : undefined}
        disabled={disabled}
        {...props}
      >
        <span className={styles.icon}>{icon}</span>
      </button>
    );
  },
);

InspectorIconButton.displayName = "InspectorIconButton";
