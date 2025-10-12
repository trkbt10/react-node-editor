/**
 * @file Common types for node communication
 */

/**
 * Position data (normalized 0-100)
 */
export type PositionData = {
  x: number; // 0-100
  y: number; // 0-100
};

/**
 * Action data from input devices
 */
export type ActionData = {
  action: "up" | "down" | "left" | "right" | "a" | "b" | "emit" | null;
  timestamp: number;
};

/**
 * Control data that can be passed between nodes
 */
export type ControlData = {
  position?: PositionData;
  action?: ActionData;
  value?: number; // Generic numeric value (0-100)
};

/**
 * Output data that nodes can emit
 */
export type NodeOutputData = {
  type: "control" | "value" | "event";
  data: ControlData | number | string;
  timestamp: number;
};
