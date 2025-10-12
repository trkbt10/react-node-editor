/**
 * @file Inspector section title component
 */
import * as React from "react";
import { H4 } from "../../elements";
import styles from "./InspectorSectionTitle.module.css";

export type InspectorSectionTitleProps = {
  className?: string;
  children: React.ReactNode;
};

export const InspectorSectionTitle: React.FC<InspectorSectionTitleProps> = ({ className, children }) => {
  const titleClassName = [styles.title, className].filter(Boolean).join(" ");
  return <H4 className={titleClassName}>{children}</H4>;
};

InspectorSectionTitle.displayName = "InspectorSectionTitle";
