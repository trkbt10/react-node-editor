/**
 * @file SVG-based resize handles for node corners (extensible to edges)
 */
import * as React from "react";
import type { Position, ResizeHandle as ResizeHandleDirection, Size } from "../../types/core";
import styles from "./ResizeHandle.module.css";

type ResizeHandlesProps = {
  /** Current node size to position handles correctly */
  size: Size;
  /** Active handle when a resize operation is in progress */
  activeHandle: ResizeHandleDirection | null;
  /** Callback when the user starts interacting with a handle */
  onResizeStart: (event: React.PointerEvent<Element>, handle: ResizeHandleDirection) => void;
  /** Handles to render (defaults to the four corners) */
  handles?: ResizeHandleDirection[];
};

const DEFAULT_HANDLES: ResizeHandleDirection[] = ["nw", "ne", "se", "sw"];

// Size mirrors --node-editor-space-md to stay on the spacing scale.
const HANDLE_SIZE = 12;
const HALF_HANDLE_SIZE = HANDLE_SIZE / 2;
// Rounded corners follow the global border radius token, resolved to a numeric value for SVG.
const resolveHandleCornerRadius = (): number => {
  if (typeof window === "undefined") {
    return 0;
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--node-editor-border-radius-xs")
    .trim();

  if (!raw) {
    return 0;
  }

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const HANDLE_CURSORS: Record<ResizeHandleDirection, React.CSSProperties["cursor"]> = {
  n: "n-resize",
  s: "s-resize",
  e: "e-resize",
  w: "w-resize",
  ne: "ne-resize",
  nw: "nw-resize",
  se: "se-resize",
  sw: "sw-resize",
};

const computeHandlePosition = (handle: ResizeHandleDirection, size: Size): Position => {
  const clampedWidth = Math.max(size.width, 0);
  const clampedHeight = Math.max(size.height, 0);
  const horizontal = handle.includes("w") ? "start" : handle.includes("e") ? "end" : "center";
  const vertical = handle.includes("n") ? "start" : handle.includes("s") ? "end" : "center";

  const resolve = (mode: "start" | "center" | "end", total: number): number => {
    if (mode === "start") {
      return 0;
    }
    if (mode === "end") {
      return total;
    }
    return total / 2;
  };

  return {
    x: resolve(horizontal, clampedWidth),
    y: resolve(vertical, clampedHeight),
  };
};

/**
 * Renders SVG-based resize handles overlay.
 * Uses pointer-event passthrough for the base while handles remain interactive.
 */
export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  size,
  activeHandle,
  onResizeStart,
  handles = DEFAULT_HANDLES,
}) => {
  const [handleCornerRadius, setHandleCornerRadius] = React.useState<number>(() => resolveHandleCornerRadius());

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateRadius = () => setHandleCornerRadius(resolveHandleCornerRadius());
    updateRadius();

    const observer = new MutationObserver(updateRadius);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => observer.disconnect();
  }, []);
  const viewBoxWidth = Math.max(size.width, 0) + HANDLE_SIZE;
  const viewBoxHeight = Math.max(size.height, 0) + HANDLE_SIZE;
  const viewBoxMinX = -HALF_HANDLE_SIZE;
  const viewBoxMinY = -HALF_HANDLE_SIZE;

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<SVGGraphicsElement>) => {
      event.stopPropagation();
      event.preventDefault();
      const handle = event.currentTarget.getAttribute("data-resize-handle") as ResizeHandleDirection | null;
      if (!handle) {
        return;
      }
      onResizeStart(event, handle);
    },
    [onResizeStart],
  );

  return (
    <div className={styles.resizeOverlay}>
      <svg
        className={styles.resizeSvg}
        width="100%"
        height="100%"
        viewBox={`${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="none"
      >
        {handles.map((handle) => {
          const cursor = HANDLE_CURSORS[handle];
          const { x, y } = computeHandlePosition(handle, size);
          const xPosition = x - HALF_HANDLE_SIZE;
          const yPosition = y - HALF_HANDLE_SIZE;
          return (
            <rect
              key={handle}
              className={styles.resizeHandle}
              x={xPosition}
              y={yPosition}
              width={HANDLE_SIZE}
              height={HANDLE_SIZE}
              rx={handleCornerRadius}
              ry={handleCornerRadius}
              data-resize-handle={handle}
              data-is-resizing={activeHandle === handle}
              style={{ cursor }}
              onPointerDown={handlePointerDown}
            />
          );
        })}
      </svg>
    </div>
  );
};

ResizeHandles.displayName = "ResizeHandles";
