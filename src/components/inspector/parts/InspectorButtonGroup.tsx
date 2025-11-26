/**
 * @file Inspector button group component for segmented controls
 */
import * as React from "react";
import styles from "./InspectorButtonGroup.module.css";

export type InspectorButtonGroupOption<T extends string = string> = {
  value: T;
  label: React.ReactNode;
};

export type InspectorButtonGroupProps<T extends string = string> = {
  options: InspectorButtonGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

export function InspectorButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  className,
  disabled,
  "aria-label": ariaLabel,
}: InspectorButtonGroupProps<T>): React.ReactElement {
  const groupClassName = [styles.group, className].filter(Boolean).join(" ");

  return (
    <div className={groupClassName} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.button}
          data-selected={value === option.value ? "true" : undefined}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

InspectorButtonGroup.displayName = "InspectorButtonGroup";
