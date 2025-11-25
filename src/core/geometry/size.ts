/**
 * @file Size-related utilities
 * Pure functions for size calculations
 */
import type { Size } from "../../types/core";

/**
 * Clamp size within min/max bounds
 */
export const clampSize = (size: Size, minSize?: Size, maxSize?: Size): Size => {
  let { width, height } = size;

  if (minSize) {
    width = Math.max(width, minSize.width);
    height = Math.max(height, minSize.height);
  }

  if (maxSize) {
    width = Math.min(width, maxSize.width);
    height = Math.min(height, maxSize.height);
  }

  return { width, height };
};

/**
 * Scale size by a factor
 */
export const scaleSize = (size: Size, factor: number): Size => ({
  width: size.width * factor,
  height: size.height * factor,
});

/**
 * Add two sizes together
 */
export const addSize = (a: Size, b: Size): Size => ({
  width: a.width + b.width,
  height: a.height + b.height,
});

/**
 * Subtract size b from size a
 */
export const subtractSize = (a: Size, b: Size): Size => ({
  width: a.width - b.width,
  height: a.height - b.height,
});
