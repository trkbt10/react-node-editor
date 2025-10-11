import * as React from "react";
import styles from "./SettingsField.module.css";

export type SettingsFieldProps = {
  children: React.ReactNode;
  className?: string;
}

/**
 * Common settings field wrapper component
 */
export const SettingsField: React.FC<SettingsFieldProps> = ({ children, className }) => {
  return <div className={className ? `${styles.settingsField} ${className}` : styles.settingsField}>{children}</div>;
};

SettingsField.displayName = "SettingsField";
