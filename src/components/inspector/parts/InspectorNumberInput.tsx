import * as React from "react";
import { Input } from "../../elements/Input";
import styles from "./InspectorNumberInput.module.css";

export type InspectorNumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

export const InspectorNumberInput = React.memo<InspectorNumberInputProps>(
  ({ value, onChange, label, id, name, "aria-label": ariaLabel }) => {
    return (
      <div className={styles.container}>
        <span className={styles.label}>{label}</span>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={styles.input}
          id={id}
          name={name}
          aria-label={ariaLabel}
        />
      </div>
    );
  }
);

InspectorNumberInput.displayName = "InspectorNumberInput";
