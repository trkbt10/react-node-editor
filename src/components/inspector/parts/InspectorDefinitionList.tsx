/**
 * @file Inspector definition list component
 */
import * as React from "react";
import styles from "./InspectorDefinitionList.module.css";

export type InspectorDefinitionListProps = {
  className?: string;
  children: React.ReactNode;
};

export const InspectorDefinitionList: React.FC<InspectorDefinitionListProps> = ({ className, children }) => {
  const listClassName = [styles.list, className].filter(Boolean).join(" ");
  return <dl className={listClassName}>{children}</dl>;
};

InspectorDefinitionList.displayName = "InspectorDefinitionList";

export type InspectorDefinitionItemProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
};

export const InspectorDefinitionItem: React.FC<InspectorDefinitionItemProps> = ({
  label,
  description,
  className,
  labelClassName,
  children,
}) => {
  const termClassName = [styles.term, labelClassName].filter(Boolean).join(" ");
  const definitionClassName = [styles.definition, className].filter(Boolean).join(" ");

  return (
    <>
      <dt className={termClassName}>
        <span className={styles.termLabel}>{label}</span>
        {description ? <span className={styles.termDescription}>{description}</span> : null}
      </dt>
      <dd className={definitionClassName}>{children}</dd>
    </>
  );
};

InspectorDefinitionItem.displayName = "InspectorDefinitionItem";
