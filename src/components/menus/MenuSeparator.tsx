/**
 * @file Menu separator component
 */
import * as React from "react";
import styles from "./MenuSeparator.module.css";

export const MenuSeparator: React.FC = () => {
  return <li className={styles.separator} aria-hidden="true" />;
};

MenuSeparator.displayName = "MenuSeparator";
