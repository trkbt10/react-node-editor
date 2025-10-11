/**
 * Interaction constants for the node editor
 */

import { DEFAULT_PORT_POSITION_CONFIG } from "../types/portPosition";

// Port radius is half of the visual size
const PORT_RADIUS = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;

/**
 * Distance threshold for port interactions
 */
export const PORT_INTERACTION_THRESHOLD = {
  /** Minimum distance to drag before disconnecting a connection (1 port radius) */
  DISCONNECT_THRESHOLD: PORT_RADIUS,
  /** Minimum distance to start a new connection (small threshold for responsiveness) */
  NEW_CONNECTION_THRESHOLD: 2,
  /** Distance within which a port becomes a candidate for connection */
  CONNECTION_SNAP_DISTANCE: PORT_RADIUS * 4,
  /** Distance within which hovering over a port is detected */
  HOVER_DISTANCE: PORT_RADIUS * 2,
} as const;

/**
 * Timing constants for interactions
 */
export const INTERACTION_TIMING = {
  /** Delay before showing tooltips */
  TOOLTIP_DELAY: 500,
  /** Duration of animations */
  ANIMATION_DURATION: 200,
} as const;