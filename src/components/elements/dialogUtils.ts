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

/** Padding from viewport edges in pixels */
const VIEWPORT_PADDING = 8;

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

  // Calculate available space with padding
  const maxX = viewport.width - menuWidth - VIEWPORT_PADDING;
  const maxY = viewport.height - menuHeight - VIEWPORT_PADDING;

  // Check if menu overflows right edge
  if (x + menuWidth + VIEWPORT_PADDING > viewport.width) {
    adjustedX = Math.max(VIEWPORT_PADDING, maxX);
  }

  // Check if menu overflows bottom edge
  if (y + menuHeight + VIEWPORT_PADDING > viewport.height) {
    adjustedY = Math.max(VIEWPORT_PADDING, maxY);
  }

  // Ensure menu doesn't go off left edge (with padding)
  if (adjustedX < VIEWPORT_PADDING) {
    adjustedX = VIEWPORT_PADDING;
  }

  // Ensure menu doesn't go off top edge (with padding)
  if (adjustedY < VIEWPORT_PADDING) {
    adjustedY = VIEWPORT_PADDING;
  }

  return {
    x: adjustedX,
    y: adjustedY,
  };
}
