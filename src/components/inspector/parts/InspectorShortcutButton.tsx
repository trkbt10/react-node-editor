/**
 * @file Compact inspector button derived from shortcut button styling.
 */
import * as React from "react";
import styles from "./InspectorShortcutButton.module.css";

export type InspectorShortcutButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const InspectorShortcutButton: React.FC<InspectorShortcutButtonProps> = ({
  type,
  className,
  ...rest
}) => {
  const mergedClassName = [styles.button, className].filter(Boolean).join(" ");
  return <button type={type ?? "button"} className={mergedClassName} {...rest} />;
};

InspectorShortcutButton.displayName = "InspectorShortcutButton";
