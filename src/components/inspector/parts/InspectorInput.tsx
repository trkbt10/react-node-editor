/**
 * @file Inspector input component
 */
import * as React from "react";
import { Input, type InputProps } from "../../elements/Input";
import styles from "./InspectorInput.module.css";

export type InspectorInputProps = {} & InputProps;

export const InspectorInput = React.forwardRef<HTMLInputElement, InspectorInputProps>(
  ({ className = "", ...props }, ref) => {
    const classes = [styles.input, className].filter(Boolean).join(" ");
    return <Input ref={ref} className={classes} {...props} />;
  },
);

InspectorInput.displayName = "InspectorInput";
