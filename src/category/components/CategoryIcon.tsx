/**
 * @file Shared category icon component
 */
import * as React from "react";
import styles from "./CategoryIcon.module.css";

export type CategoryIconProps = {
  icon: React.ReactNode;
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ icon }) => {
  return <span className={styles.categoryIcon}>{icon}</span>;
};

CategoryIcon.displayName = "CategoryIcon";
