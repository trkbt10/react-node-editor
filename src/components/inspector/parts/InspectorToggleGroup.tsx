/**
 * @file Inspector toggle group component for grouped toggle buttons
 */
import * as React from "react";
import styles from "./InspectorToggleGroup.module.css";

export type InspectorToggleGroupOption<T extends string = string> = {
  value: T;
  /** Label content - can be text or an icon */
  label: React.ReactNode;
  /** Accessible label for the option (used when label is an icon) */
  "aria-label"?: string;
};

export type InspectorToggleGroupProps<T extends string = string> = {
  /** Available options */
  options: InspectorToggleGroupOption<T>[];
  /** Currently selected values (for multi-select) or single value (for single-select) */
  value: T | T[];
  /** Callback when selection changes */
  onChange: (value: T | T[]) => void;
  /** Whether multiple selections are allowed */
  multiple?: boolean;
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
 * A group of toggle buttons that can be used for single or multiple selections.
 * Unlike InspectorButtonGroup which enforces single selection, this component
 * allows for more flexible selection modes while maintaining visual grouping.
 * Does not include external layout - layout should be controlled externally.
 */
export function InspectorToggleGroup<T extends string = string>({
  options,
  value,
  onChange,
  multiple = false,
  className,
  disabled,
  "aria-label": ariaLabel,
  size = "default",
}: InspectorToggleGroupProps<T>): React.ReactElement {
  const groupClassName = [styles.group, className].filter(Boolean).join(" ");
  const selectedValues = Array.isArray(value) ? value : [value];

  const handleClick = (optionValue: T) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [value];
      const isSelected = currentValues.includes(optionValue);
      if (isSelected) {
        onChange(currentValues.filter((v) => v !== optionValue) as T[]);
      } else {
        onChange([...currentValues, optionValue] as T[]);
      }
    } else {
      onChange(optionValue);
    }
  };

  return (
    <div className={groupClassName} role="group" aria-label={ariaLabel} data-size={size}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={styles.button}
            data-selected={isSelected ? "true" : undefined}
            onClick={() => handleClick(option.value)}
            disabled={disabled}
            aria-pressed={isSelected}
            aria-label={option["aria-label"]}
          >
            <span className={styles.content}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

InspectorToggleGroup.displayName = "InspectorToggleGroup";
