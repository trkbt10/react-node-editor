import * as React from "react";
import { Input } from "../../components/elements";
import type { InputProps } from "../../components/elements";
import styles from "./SettingsInput.module.css";

export type SettingsInputProps = {} & InputProps

/**
 * Common settings input component
 */
export const SettingsInput: React.FC<SettingsInputProps> = (props) => {
  const className = props.className ? `${styles.settingsInput} ${props.className}` : styles.settingsInput;
  return <Input {...props} className={className} />;
};

SettingsInput.displayName = "SettingsInput";
