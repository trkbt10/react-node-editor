/**
 * @file Geometry comparison utilities
 * Pure functions for comparing Position and Size objects
 */
import type { Position, Size } from "../../types/core";

/**
 * Check if two positions are different
 */
export const hasPositionChanged = (
  prev: Position | undefined | null,
  next: Position | undefined | null,
): boolean => prev?.x !== next?.x || prev?.y !== next?.y;

/**
 * Check if two positions are equal
 */
export const arePositionsEqual = (
  a: Position | undefined | null,
  b: Position | undefined | null,
): boolean => !hasPositionChanged(a, b);

/**
 * Check if two sizes are different
 */
export const hasSizeChanged = (
  prev: Size | undefined | null,
  next: Size | undefined | null,
): boolean => prev?.width !== next?.width || prev?.height !== next?.height;

/**
 * Check if two sizes are equal
 */
export const areSizesEqual = (
  a: Size | undefined | null,
  b: Size | undefined | null,
): boolean => !hasSizeChanged(a, b);

/**
 * Check if any of multiple positions have changed
 * Useful for memo comparisons involving multiple position sources
 */
export const hasAnyPositionChanged = (
  pairs: Array<[Position | undefined | null, Position | undefined | null]>,
): boolean => pairs.some(([prev, next]) => hasPositionChanged(prev, next));

/**
 * Check if any of multiple sizes have changed
 */
export const hasAnySizeChanged = (
  pairs: Array<[Size | undefined | null, Size | undefined | null]>,
): boolean => pairs.some(([prev, next]) => hasSizeChanged(prev, next));
