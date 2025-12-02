/**
 * @file Inspector button group component for segmented controls
 */
import * as React from "react";
import styles from "./InspectorButtonGroup.module.css";

export type InspectorButtonGroupOption<T extends string = string> = {
  value: T;
  /** Label content - can be text or an icon */
  label: React.ReactNode;
  /** Accessible label for the option (used when label is an icon) */
  "aria-label"?: string;
};

export type InspectorButtonGroupProps<T extends string = string> = {
  /** Available options */
  options: InspectorButtonGroupOption<T>[];
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Additional CSS class */
  className?: string;
  /** Disable all options */
  disabled?: boolean;
  /** Accessible label for the group */
  "aria-label"?: string;
  /** Visual size variant */
  size?: "default" | "compact";
};

/**
 * Segmented button group for selecting between mutually exclusive options.
 * Commonly used for toggle-style selections like alignment, sizing modes, etc.
 * Does not include external layout - layout should be controlled externally.
 */
export function InspectorButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  className,
  disabled,
  "aria-label": ariaLabel,
  size = "default",
}: InspectorButtonGroupProps<T>): React.ReactElement {
  const groupClassName = [styles.group, className].filter(Boolean).join(" ");

  return (
    <div className={groupClassName} role="group" aria-label={ariaLabel} data-size={size}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.button}
          data-selected={value === option.value ? "true" : undefined}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          aria-pressed={value === option.value}
          aria-label={option["aria-label"]}
        >
          <span className={styles.content}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

InspectorButtonGroup.displayName = "InspectorButtonGroup";
