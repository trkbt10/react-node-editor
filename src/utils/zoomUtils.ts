/**
 * @file Zoom scale utilities providing consistent clamping and edge damping.
 */

export const MIN_ZOOM_SCALE = 0.01;
export const MAX_ZOOM_SCALE = 10;

const LOG_MIN = Math.log(MIN_ZOOM_SCALE);
const LOG_MAX = Math.log(MAX_ZOOM_SCALE);
const LOG_RANGE = LOG_MAX - LOG_MIN;

export type ZoomDeltaOptions = {
  baseStep?: number;
  dampingStrength?: number;
  deltaLimit?: number;
};

const clamp01 = (value: number): number => {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
};

const getLogProgress = (scale: number): number => {
  const clampedScale = clampZoomScale(scale);
  if (LOG_RANGE === 0) {
    return 0.5;
  }

  return clamp01((Math.log(clampedScale) - LOG_MIN) / LOG_RANGE);
};

const getEdgeResistance = (scale: number, dampingStrength: number): number => {
  const progress = getLogProgress(scale);
  const edgeProximity = Math.abs(progress - 0.5) * 2;
  const easedProximity = edgeProximity ** 1.5;
  const resistance = 1 - dampingStrength * easedProximity;
  const minimumResistance = 0.1;
  return resistance < minimumResistance ? minimumResistance : resistance;
};

/**
 * Clamp the zoom scale within supported bounds.
 */
export const clampZoomScale = (scale: number): number => {
  if (scale < MIN_ZOOM_SCALE) {
    return MIN_ZOOM_SCALE;
  }
  if (scale > MAX_ZOOM_SCALE) {
    return MAX_ZOOM_SCALE;
  }
  return scale;
};

/**
 * Apply a relative zoom delta with damping near the allowed extremes.
 */
export const applyZoomDelta = (currentScale: number, delta: number, options: ZoomDeltaOptions = {}): number => {
  const { baseStep = 0.25, dampingStrength = 0.75, deltaLimit = 1 } = options;
  if (delta === 0) {
    return clampZoomScale(currentScale);
  }

  const limitedDelta = delta > deltaLimit ? deltaLimit : delta < -deltaLimit ? -deltaLimit : delta;
  const safeStep = baseStep <= 0 ? 0.01 : baseStep;
  const resistance = getEdgeResistance(currentScale, clamp01(dampingStrength));
  const multiplier = 1 + limitedDelta * safeStep * resistance;

  if (multiplier <= 0) {
    return MIN_ZOOM_SCALE;
  }

  return clampZoomScale(currentScale * multiplier);
};

/**
 * Debug notes:
 * - Reviewed src/components/canvas/CanvasBase.tsx to ensure wheel handlers use the damped delta helpers.
 * - Reviewed src/contexts/NodeCanvasContext.tsx to confirm clamping logic matches exported limits.
 */
