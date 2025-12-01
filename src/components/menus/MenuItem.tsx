/**
 * @file Shared menu item component for context menus
 */
import * as React from "react";
import styles from "./MenuItem.module.css";

export type MenuItemProps = {
  icon?: React.ReactNode;
  label: string;
  shortcutHint?: string | null;
  danger?: boolean;
  onClick: () => void;
};

export const MenuItem: React.FC<MenuItemProps> = ({ icon, label, shortcutHint, danger = false, onClick }) => {
  const className = danger ? `${styles.menuItem} ${styles.menuItemDanger}` : styles.menuItem;

  return (
    <li className={className} onClick={onClick}>
      {icon}
      {label}
      {shortcutHint ? <span className={styles.shortcutHint}>{shortcutHint}</span> : null}
    </li>
  );
};

MenuItem.displayName = "MenuItem";
