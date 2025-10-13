/**
 * @file Shared SVG marker shape definitions for connection rendering.
 */
export type MarkerShapeId = "triangle";

export type MarkerShapeDimensions = {
  depth: number;
  halfBase: number;
};

export type MarkerShapeGeometry = {
  id: MarkerShapeId;
  path: string;
  viewBox: { minX: number; minY: number; width: number; height: number };
  tip: { x: number; y: number };
  centroid: { x: number; y: number };
};

type MarkerPlacementOptions = {
  offset: number;
};

export type MarkerPlacement = {
  path: string;
  viewBox: string;
  refX: number;
  refY: number;
  markerWidth: number;
  markerHeight: number;
  markerUnits: "userSpaceOnUse";
  orient: "auto";
};

const createTriangleGeometry = ({ depth, halfBase }: MarkerShapeDimensions): MarkerShapeGeometry => {
  const minX = 0;
  const maxX = depth;
  const minY = -halfBase;
  const maxY = halfBase;

  return {
    id: "triangle",
    path: `M ${depth} 0 L 0 ${halfBase} L 0 ${-halfBase} Z`,
    viewBox: { minX, minY, width: maxX - minX, height: maxY - minY },
    tip: { x: depth, y: 0 },
    centroid: { x: depth / 3, y: 0 },
  };
};

export const createMarkerGeometry = (id: MarkerShapeId, dimensions: MarkerShapeDimensions): MarkerShapeGeometry => {
  switch (id) {
    case "triangle":
      return createTriangleGeometry(dimensions);
    default: {
      const exhaustiveCheck: never = id;
      throw new Error(`Unsupported marker shape: ${exhaustiveCheck}`);
    }
  }
};

export const placeMarkerGeometry = (
  geometry: MarkerShapeGeometry,
  { offset }: MarkerPlacementOptions,
): MarkerPlacement => {
  const clampedOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0;
  const anchorX = geometry.tip.x - clampedOffset;
  const minRef = geometry.viewBox.minX;
  const maxRef = geometry.viewBox.minX + geometry.viewBox.width;
  const refX = Math.max(minRef, Math.min(maxRef, anchorX));

  return {
    path: geometry.path,
    viewBox: `${geometry.viewBox.minX} ${geometry.viewBox.minY} ${geometry.viewBox.width} ${geometry.viewBox.height}`,
    refX,
    refY: geometry.tip.y,
    markerWidth: geometry.viewBox.width,
    markerHeight: geometry.viewBox.height,
    markerUnits: "userSpaceOnUse",
    orient: "auto",
  };
};
