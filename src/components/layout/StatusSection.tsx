/**
 * @file Status section component
 */
import * as React from "react";
import styles from "./StatusSection.module.css";

export type StatusSectionProps = {
  label: string;
  value: React.ReactNode;
  labelClassName?: string;
  valueClassName?: string;
};

export const StatusSection: React.FC<StatusSectionProps> = ({
  label,
  value,
  labelClassName,
  valueClassName,
}) => {
  const mergedLabelClassName = labelClassName ? `${styles.statusLabel} ${labelClassName}` : styles.statusLabel;
  const mergedValueClassName = valueClassName ? `${styles.statusValue} ${valueClassName}` : styles.statusValue;

  return (
    <div className={styles.statusSection} data-status-section="true">
      <span className={mergedLabelClassName}>{label}:</span>
      <span className={mergedValueClassName}>{value}</span>
    </div>
  );
};

StatusSection.displayName = "StatusSection";

// Export styles for external use
export const statusSectionStyles = styles;
