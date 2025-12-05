/**
 * @file Shared data type styling helpers for the custom port example.
 */
import type { Connection, Port } from "../../../../../types/core";
import { primaryPortDataType } from "../../../../../core/port/dataType";

export type DataTypeStyle = {
  primary: string;
  secondary: string;
  accent: string;
  label: string;
  iconPath: string;
};

const DEFAULT_DATA_STYLE: DataTypeStyle = {
  primary: "#6c7080",
  secondary: "#d7d9de",
  accent: "#f4f5f7",
  label: "Generic",
  iconPath: "M 16 24 L 32 24 M 16 18 L 32 18 M 16 30 L 32 30",
};

const DATA_TYPE_STYLES: Record<string, DataTypeStyle> = {
  data: {
    primary: "#22c55e",
    secondary: "#a7f3d0",
    accent: "#bbf7d0",
    label: "Data",
    iconPath: "M 18 32 L 18 16 L 24 12 L 30 16 L 30 32",
  },
  image: {
    primary: "#3b82f6",
    secondary: "#bfdbfe",
    accent: "#c7d2fe",
    label: "Image",
    iconPath: "M 18 30 L 24 22 L 29 27 L 32 24 L 32 30 Z M 20 20 A 3 3 0 1 1 26 20 A 3 3 0 1 1 20 20",
  },
  audio: {
    primary: "#f97316",
    secondary: "#fed7aa",
    accent: "#fb923c",
    label: "Audio",
    iconPath: "M 18 24 L 24 18 L 24 30 L 18 24 M 28 20 Q 32 24 28 28",
  },
  video: {
    primary: "#9333ea",
    secondary: "#ddd6fe",
    accent: "#c084fc",
    label: "Video",
    iconPath: "M 20 18 L 20 30 L 30 24 Z M 32 20 L 36 20 L 36 28 L 32 28 Z",
  },
};

export const getStyleForDataType = (dataType?: Port["dataType"]): DataTypeStyle => {
  const key = primaryPortDataType(dataType) ?? "";
  return DATA_TYPE_STYLES[key] ?? DEFAULT_DATA_STYLE;
};

export const countConnectionsForPort = (allConnections: Record<string, Connection>, portId: Port["id"]): number => {
  return Object.values(allConnections).filter((connection) => {
    return connection.fromPortId === portId || connection.toPortId === portId;
  }).length;
};
