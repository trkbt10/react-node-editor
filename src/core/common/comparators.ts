/**
 * @file Common comparison utilities
 * Generic comparison functions used across domain comparators
 */

/**
 * Check if two string arrays are equal (order-sensitive)
 */
export const areStringArraysEqual = (prev?: string[], next?: string[]): boolean => {
  if (prev === next) {
    return true;
  }
  if (!prev && !next) {
    return true;
  }
  if (!prev || !next) {
    return false;
  }
  if (prev.length !== next.length) {
    return false;
  }
  return prev.every((value, index) => value === next[index]);
};

/**
 * Check if two plain values are equal (primitives only, not objects/functions)
 */
export const isPlainValueEqual = (prevValue: unknown, nextValue: unknown): boolean => {
  if (prevValue === nextValue) {
    return true;
  }
  const prevType = typeof prevValue;
  const nextType = typeof nextValue;
  if (prevType !== nextType) {
    return false;
  }
  if (prevValue === null || nextValue === null) {
    return false;
  }
  if (prevType === "object" || prevType === "function") {
    return false;
  }
  return Object.is(prevValue, nextValue);
};

/**
 * Shallow equality check for record values (checks each key's value with isPlainValueEqual)
 */
export const areRecordValuesShallowEqual = (
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
): boolean => {
  if (prev === next) {
    return true;
  }
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  return prevKeys.every((key) => {
    if (!Object.prototype.hasOwnProperty.call(next, key)) {
      return false;
    }
    return isPlainValueEqual(prev[key], next[key]);
  });
};
