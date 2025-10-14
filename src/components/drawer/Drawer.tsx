/**
 * @file Drawer component
 * Mobile-friendly slide-in panel with backdrop
 */
import * as React from "react";
import type { DrawerBehavior } from "../../types/panels";
import styles from "./Drawer.module.css";

export type DrawerProps = {
  /** Unique identifier for the drawer */
  id: string;
  /** Drawer behavior configuration */
  config: DrawerBehavior;
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** Drawer content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Z-index override */
  zIndex?: number;
  /** Width override */
  width?: string | number;
  /** Height override */
  height?: string | number;
};

/**
 * Get dimensions styles
 */
const getDimensionsStyle = (width?: number | string, height?: number | string): React.CSSProperties => {
  const style: React.CSSProperties = {};

  if (width !== undefined) {
    style.width = typeof width === "number" ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === "number" ? `${height}px` : height;
  }

  return style;
};

/**
 * Drawer component - slide-in panel with backdrop
 */
export const Drawer: React.FC<DrawerProps> = ({
  id,
  config,
  isOpen,
  onClose,
  children,
  className,
  style: styleProp,
  zIndex,
  width,
  height,
}) => {
  const { placement, showBackdrop = true, backdropOpacity = 0.5, size, dismissible = true, header } = config;

  // Build drawer-specific styles
  const drawerStyle: React.CSSProperties = {
    ...styleProp,
    ...(zIndex !== undefined && { zIndex }),
    ...getDimensionsStyle(width, height),
  };

  // Apply size based on placement
  if (size !== undefined) {
    if (placement === "top" || placement === "bottom") {
      drawerStyle.height = typeof size === "number" ? `${size}px` : size;
    } else {
      drawerStyle.width = typeof size === "number" ? `${size}px` : size;
    }
  }

  const showCloseButton = header?.showCloseButton ?? (header !== undefined);

  return (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className={styles.drawerBackdrop}
          data-open={isOpen}
          style={{ backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` }}
          onClick={dismissible ? onClose : undefined}
        />
      )}

      {/* Drawer */}
      <div
        className={`${styles.drawer} ${className || ""}`}
        data-layer-id={id}
        data-placement={placement}
        data-open={isOpen}
        style={drawerStyle}
      >
        {header && (
          <div className={styles.drawerHeader}>
            {header.title && <div className={styles.drawerHeaderTitle}>{header.title}</div>}
            {showCloseButton && dismissible && (
              <button
                className={styles.drawerHeaderCloseButton}
                onClick={onClose}
                aria-label="Close drawer"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className={header ? styles.drawerContent : undefined}>{children}</div>
      </div>
    </>
  );
};
