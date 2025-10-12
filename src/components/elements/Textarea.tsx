/**
 * @file Textarea component
 */
import React from "react";
import styles from "./Textarea.module.css";

export type TextareaProps = {
  error?: boolean;
  variant?: "default" | "outline" | "filled";
  resize?: "none" | "vertical" | "horizontal" | "both";
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea: React.FC<TextareaProps> = ({
  error = false,
  variant = "default",
  resize = "vertical",
  className = "",
  ...props
}) => {
  const classes = [styles.textarea, className].filter(Boolean).join(" ");

  return (
    <textarea
      className={classes}
      data-variant={variant}
      data-error={error ? "true" : "false"}
      data-resize={resize}
      {...props}
    />
  );
};
