/**
 * @file Generic clipboard utilities for copy/paste operations
 * This module provides low-level clipboard storage without domain-specific logic
 */
import type { NodeData, Size, Position } from "../types/core";

export type ClipboardNode = {
  id: string;
  type: string;
  position: Position;
  size?: Size;
  data?: NodeData;
};

export type ClipboardConnection = {
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
};

export type ClipboardData = {
  nodes: ClipboardNode[];
  connections: ClipboardConnection[];
};

let clipboard: ClipboardData | null = null;

/**
 * Set clipboard data
 * @param data - Clipboard data to set
 */
export function setClipboard(data: ClipboardData) {
  clipboard = data;
}

/**
 * Get current clipboard data
 * @returns Current clipboard data or null if empty
 */
export function getClipboard(): ClipboardData | null {
  return clipboard;
}

/**
 * Clear clipboard data
 */
export function clearClipboard() {
  clipboard = null;
}
