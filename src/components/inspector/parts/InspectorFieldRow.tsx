/**
 * @file Inspector field row component for horizontal label-control layout
 */
import * as React from "react";
import styles from "./InspectorFieldRow.module.css";

export type InspectorFieldRowProps = {
  /** Label text or element displayed on the left side */
  label: React.ReactNode;
  /** Props passed to the label span element */
  labelProps?: React.HTMLAttributes<HTMLSpanElement>;
  /** Additional class name for the container */
  className?: string;
  /** Form control(s) displayed on the right side */
  children: React.ReactNode;
};

/**
 * A horizontal field row with label on the left and control(s) on the right.
 * Use this for inline label-control patterns common in inspector panels.
 *
 * @example
 * ```tsx
 * <InspectorFieldRow label="Alignment">
 *   <InspectorButtonGroup options={options} value={value} onChange={onChange} />
 * </InspectorFieldRow>
 *
 * <InspectorFieldRow label="Position">
 *   <InspectorInputGrid>
 *     <InspectorInput label="X" value="100" onChange={() => {}} />
 *     <InspectorInput label="Y" value="200" onChange={() => {}} />
 *   </InspectorInputGrid>
 * </InspectorFieldRow>
 * ```
 */
export const InspectorFieldRow: React.FC<InspectorFieldRowProps> = ({
  label,
  labelProps,
  className,
  children,
}) => {
  const containerClassName = [styles.fieldRow, className].filter(Boolean).join(" ");
  const labelClassName = [styles.label, labelProps?.className].filter(Boolean).join(" ");

  return (
    <div className={containerClassName}>
      <span {...labelProps} className={labelClassName}>
        {label}
      </span>
      <div className={styles.control}>{children}</div>
    </div>
  );
};

InspectorFieldRow.displayName = "InspectorFieldRow";
