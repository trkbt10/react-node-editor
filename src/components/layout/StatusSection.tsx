/**
 * @file Status section component
 */
import * as React from "react";
import styles from "./StatusSection.module.css";

export type StatusSectionProps = {
  label: string;
  value: React.ReactNode;
  /** Variant type for styling - use CSS [data-variant="..."] selector */
  variant?: "default" | "mode" | "saving";
};

export const StatusSection: React.FC<StatusSectionProps> = React.memo(({
  label,
  value,
  variant,
}) => {
  return (
    <div className={styles.statusSection} data-status-section="true" data-variant={variant}>
      <span className={styles.statusLabel}>{label}:</span>
      <span className={styles.statusValue}>{value}</span>
    </div>
  );
});

StatusSection.displayName = "StatusSection";
