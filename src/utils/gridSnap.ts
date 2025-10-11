import type { Position } from "../types/core";
import type { GridSettings } from "../types/core";

/**
 * Snap a position to the nearest grid point
 */
export function snapToGrid(
  position: Position,
  gridSettings: GridSettings
): Position {
  if (!gridSettings.snapToGrid) {
    return position;
  }

  const { size, snapThreshold } = gridSettings;

  // Calculate the nearest grid points
  const gridX = Math.round(position.x / size) * size;
  const gridY = Math.round(position.y / size) * size;

  // Calculate distance to nearest grid point
  const distanceX = Math.abs(position.x - gridX);
  const distanceY = Math.abs(position.y - gridY);

  // Apply snapping if within threshold
  return {
    x: distanceX <= snapThreshold ? gridX : position.x,
    y: distanceY <= snapThreshold ? gridY : position.y,
  };
}

/**
 * Snap multiple positions to grid while maintaining relative positions
 */
export function snapMultipleToGrid(
  positions: Record<string, Position>,
  gridSettings: GridSettings,
  primaryNodeId: string
): Record<string, Position> {
  if (!gridSettings.snapToGrid) {
    return positions;
  }

  const primaryPosition = positions[primaryNodeId];
  if (!primaryPosition) {
    // Fallback to individual snapping if no primary node
    const snappedPositions: Record<string, Position> = {};
    Object.entries(positions).forEach(([nodeId, position]) => {
      snappedPositions[nodeId] = snapToGrid(position, gridSettings);
    });
    return snappedPositions;
  }

  // Snap the primary node
  const snappedPrimary = snapToGrid(primaryPosition, gridSettings);
  const deltaX = snappedPrimary.x - primaryPosition.x;
  const deltaY = snappedPrimary.y - primaryPosition.y;

  // Apply the same delta to all nodes to maintain relative positions
  const snappedPositions: Record<string, Position> = {};
  Object.entries(positions).forEach(([nodeId, position]) => {
    snappedPositions[nodeId] = {
      x: position.x + deltaX,
      y: position.y + deltaY,
    };
  });

  return snappedPositions;
}

/**
 * Get visual snap guides for a position
 */
export function getSnapGuides(
  position: Position,
  gridSettings: GridSettings
): { horizontal: number | null; vertical: number | null } {
  if (!gridSettings.snapToGrid || !gridSettings.showGrid) {
    return { horizontal: null, vertical: null };
  }

  const { size, snapThreshold } = gridSettings;

  // Calculate the nearest grid lines
  const nearestGridX = Math.round(position.x / size) * size;
  const nearestGridY = Math.round(position.y / size) * size;

  // Check if close enough to show guides
  const distanceX = Math.abs(position.x - nearestGridX);
  const distanceY = Math.abs(position.y - nearestGridY);

  return {
    horizontal: distanceY <= snapThreshold * 1.5 ? nearestGridY : null,
    vertical: distanceX <= snapThreshold * 1.5 ? nearestGridX : null,
  };
}

/**
 * Calculate grid-aligned bounding box
 */
export function getGridAlignedBounds(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  gridSize: number
): { minX: number; minY: number; maxX: number; maxY: number } {
  return {
    minX: Math.floor(bounds.minX / gridSize) * gridSize,
    minY: Math.floor(bounds.minY / gridSize) * gridSize,
    maxX: Math.ceil(bounds.maxX / gridSize) * gridSize,
    maxY: Math.ceil(bounds.maxY / gridSize) * gridSize,
  };
}