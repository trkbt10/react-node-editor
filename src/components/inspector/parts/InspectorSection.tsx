import * as React from "react";
import styles from "./InspectorSection.module.css";

export type InspectorSectionProps = {
  className?: string;
  children: React.ReactNode;
}

export const InspectorSection: React.FC<InspectorSectionProps> = ({ className, children }) => {
  const sectionClassName = [styles.section, className].filter(Boolean).join(" ");
  return <div className={sectionClassName}>{children}</div>;
};

InspectorSection.displayName = "InspectorSection";
