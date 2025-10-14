/**
 * @file Property section component
 */
import * as React from "react";
import { H4 } from "../../elements/Heading";
import styles from "./PropertySection.module.css";

export type PropertySectionProps = {
  title: string;
  className?: string;
  bodyClassName?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * PropertySection
 * - Reusable sidebar section with a small, uppercase title
 * - Applies consistent vertical spacing (Figma-like)
 */
export const PropertySection: React.FC<PropertySectionProps> = ({
  title,
  className,
  bodyClassName,
  headerRight,
  children,
}) => {
  return (
    <section className={[styles.section, className].filter(Boolean).join(" ")}>
      <div className={styles.sectionHeader}>
        <H4 size="compact" weight="semibold" className={styles.sectionTitle}>
          {title}
        </H4>
        {headerRight ? <div className={styles.sectionHeaderMeta}>{headerRight}</div> : null}
      </div>
      <div className={[styles.sectionBody, bodyClassName].filter(Boolean).join(" ")}>{children}</div>
    </section>
  );
};

PropertySection.displayName = "PropertySection";
