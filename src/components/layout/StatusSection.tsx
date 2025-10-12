/**
 * @file Status section component
 */
import * as React from "react";
import { classNames } from "../elements";
import styles from "./StatusSection.module.css";

export type StatusSectionProps = {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export const StatusSection: React.FC<StatusSectionProps> = ({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
}) => {
  return (
    <div className={classNames(styles.statusSection, className)}>
      <span className={classNames(styles.statusLabel, labelClassName)}>{label}:</span>
      <span className={classNames(styles.statusValue, valueClassName)}>{value}</span>
    </div>
  );
};

StatusSection.displayName = "StatusSection";

// Export styles for external use
export const statusSectionStyles = styles;