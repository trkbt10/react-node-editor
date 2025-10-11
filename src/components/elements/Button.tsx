import React from "react";
import styles from "./Button.module.css";

export type ButtonProps = {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "medium",
  className = "",
  children,
  ...props
}) => {
  const classes = [styles.button, className].filter(Boolean).join(" ");

  return (
    <button className={classes} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  );
};
