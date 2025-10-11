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































export function setClipboard(data: ClipboardData) {
  clipboard = data;
}































export function getClipboard(): ClipboardData | null {
  return clipboard;
}































export function clearClipboard() {
  clipboard = null;
}
