/**
 * @file Dialog utilities
 */
export type ViewportInfo = {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
};

export type Position = {
  x: number;
  y: number;
};

/**
 * Get viewport information
 */
export function getViewportInfo(): ViewportInfo {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };
}

/**
 * Calculate optimal position for a context menu to avoid viewport overflow
 */
export function calculateContextMenuPosition(
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number,
  viewport: ViewportInfo,
): Position {
  let adjustedX = x;
  let adjustedY = y;

  // Check if menu overflows right edge
  if (x + menuWidth > viewport.width) {
    adjustedX = Math.max(0, viewport.width - menuWidth);
  }

  // Check if menu overflows bottom edge
  if (y + menuHeight > viewport.height) {
    adjustedY = Math.max(0, viewport.height - menuHeight);
  }

  // Ensure menu doesn't go off left edge
  if (adjustedX < 0) {
    adjustedX = 0;
  }

  // Ensure menu doesn't go off top edge
  if (adjustedY < 0) {
    adjustedY = 0;
  }

  return {
    x: adjustedX,
    y: adjustedY,
  };
}
