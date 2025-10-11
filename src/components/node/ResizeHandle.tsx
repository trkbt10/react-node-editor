import * as React from "react";
import { classNames } from "../elements";
import styles from "./ResizeHandle.module.css";

export type ResizeHandleProps = {
  /** The resize handle position - now only 'se' (bottom-right) is supported */
  position: 'se';
  /** Called when resize starts */
  onResizeStart: (e: React.PointerEvent, handle: 'se') => void;
  /** Whether this handle is currently being used for resizing */
  isResizing?: boolean;
  /** Whether the handle should be visible (when parent node is hovered or selected) */
  isVisible?: boolean;
}

/**
 * ResizeHandle - Individual resize handle for nodes
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  position,
  onResizeStart,
  isResizing = false,
  isVisible = false,
}) => {
  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onResizeStart(e, position);
  }, [onResizeStart, position]);

  const getPositionStyles = (): React.CSSProperties => {
    const size = 10; // Slightly larger for better usability
    const offset = -2; // Closer to the node edge (was -size/2)

    // Only support bottom-right resize to avoid conflicts with ports
    return { 
      bottom: offset, 
      right: offset, 
      cursor: 'se-resize',
      width: size,
      height: size,
    };
  };

  return (
    <div
      className={classNames(
        styles.resizeHandle,
        isVisible && styles.resizeHandleVisible,
        isResizing && styles.resizeHandleActive
      )}
      style={{
        position: 'absolute',
        zIndex: 10,
        ...getPositionStyles(),
      }}
      onPointerDown={handlePointerDown}
      data-resize-handle={position}
    />
  );
};

ResizeHandle.displayName = "ResizeHandle";