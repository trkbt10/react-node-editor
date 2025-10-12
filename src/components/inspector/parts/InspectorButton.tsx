/**
 * @file Inspector button component
 */
import * as React from "react";
import { Button, type ButtonProps } from "../../elements/Button";

export type InspectorButtonProps = {
  size?: "small" | "medium";
} & Omit<ButtonProps, "size">;

export const InspectorButton: React.FC<InspectorButtonProps> = ({ size = "small", variant = "secondary", ...rest }) => {
  return <Button size={size} variant={variant} {...rest} />;
};

InspectorButton.displayName = "InspectorButton";
