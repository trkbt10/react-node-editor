import * as React from "react";
import styles from "./InspectorField.module.css";

export type InspectorFieldProps = {
  label?: React.ReactNode;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  className?: string;
  children: React.ReactNode;
}

export const InspectorField: React.FC<InspectorFieldProps> = ({ label, labelProps, className, children }) => {
  const fieldClassName = [styles.field, className].filter(Boolean).join(" ");

  return (
    <div className={fieldClassName}>
      {label !== undefined && label !== null ? <label {...labelProps}>{label}</label> : null}
      {children}
    </div>
  );
};

InspectorField.displayName = "InspectorField";
