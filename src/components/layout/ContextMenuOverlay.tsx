/**
 * @file Shared overlay container for context menus rendered via <dialog>
 */
import * as React from "react";
import { createPortal } from "react-dom";
import type { Position } from "../../types/core";
import { calculateContextMenuPosition, getViewportInfo } from "../elements/dialogUtils";
import { ensureDialogPolyfill } from "../../utils/polyfills/createDialogPolyfill";
import styles from "./ContextMenuOverlay.module.css";

type DataAttributes = Record<string, string | number | boolean>;

export type ContextMenuOverlayProps = {
  anchor: Position;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  dataAttributes?: Record<string, string | number | boolean | null | undefined>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  onPositionChange?: (position: Position) => void;
};

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

ensureDialogPolyfill();

export const ContextMenuOverlay: React.FC<ContextMenuOverlayProps> = ({
  anchor,
  visible,
  onClose,
  children,
  contentClassName,
  contentStyle,
  dataAttributes,
  onKeyDown,
  onPositionChange,
}) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const internalContentRef = React.useRef<HTMLDivElement>(null);
  const [computedPosition, setComputedPosition] = React.useState<Position>(anchor);

  const updatePosition = React.useCallback(() => {
    if (!isBrowser || !internalContentRef.current) {
      return;
    }

    const rect = internalContentRef.current.getBoundingClientRect();
    const viewport = getViewportInfo();
    const nextPosition = calculateContextMenuPosition(anchor.x, anchor.y, rect.width, rect.height, viewport);
    setComputedPosition(nextPosition);
    onPositionChange?.(nextPosition);
  }, [anchor.x, anchor.y, onPositionChange]);

  React.useLayoutEffect(() => {
    if (!visible || !isBrowser || !dialogRef.current) {
      return;
    }

    const dialog = dialogRef.current;
    dialog.showModal();

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [visible]);

  React.useEffect(() => {
    if (visible) {
      setComputedPosition(anchor);
    }
  }, [visible, anchor.x, anchor.y]);

  React.useLayoutEffect(() => {
    if (!visible) {
      return;
    }
    updatePosition();
  }, [visible, updatePosition]);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }
      if (internalContentRef.current && !internalContentRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [visible, onClose]);

  React.useEffect(() => {
    if (!visible || !dialogRef.current) {
      return;
    }

    const dialog = dialogRef.current;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [visible, onClose]);

  const mergedStyle: React.CSSProperties = {
    ...contentStyle,
    left: computedPosition.x,
    top: computedPosition.y,
  };

  const dataProps = React.useMemo<DataAttributes>(() => {
    if (!dataAttributes) {
      return {};
    }
    return Object.entries(dataAttributes).reduce<DataAttributes>((acc, [key, value]) => {
      if (value === null || value === undefined) {
        return acc;
      }
      acc[`data-${key}`] = value;
      return acc;
    }, {});
  }, [dataAttributes]);

  if (!isBrowser || !visible) {
    return null;
  }

  return createPortal(
    <dialog ref={dialogRef} className={styles.contextDialog}>
      <div
        ref={internalContentRef}
        className={`${styles.contextContent}${contentClassName ? ` ${contentClassName}` : ""}`}
        style={mergedStyle}
        onKeyDown={onKeyDown}
        {...dataProps}
      >
        {children}
      </div>
    </dialog>,
    document.body,
  );
};

ContextMenuOverlay.displayName = "ContextMenuOverlay";
