/**
 * @file Connection styling tokens and helpers for the custom port example.
 */
import type { ConnectionRenderContext } from "../../../types/NodeDefinition";
import { primaryPortDataType } from "../../../utils/portDataTypeUtils";

export type ConnectionVariant = "default" | "data" | "image" | "audio" | "video";

export const isConnectionVariant = (value: string | undefined): value is ConnectionVariant => {
  return value === "data" || value === "image" || value === "audio" || value === "video" || value === "default";
};

export type ConnectionOverlayVariant = "dashed" | "matrix" | "pulses" | "scanlines" | null;

export type ConnectionVariantTokens = {
  energyDasharray: string;
  energyOpacity: number;
  haloScale: number;
  flowSpeed: number;
  markerScale: number;
  strokeScale: number;
  badgeOuter: string;
  badgeInner: string;
  badgeText: string;
  overlay: ConnectionOverlayVariant;
};

export const CONNECTION_VARIANT_TOKENS: Record<ConnectionVariant, ConnectionVariantTokens> = {
  default: {
    energyDasharray: "26 22",
    energyOpacity: 1,
    haloScale: 1,
    flowSpeed: 1,
    markerScale: 0.95,
    strokeScale: 1,
    badgeOuter: "rgba(15, 23, 42, 0.55)",
    badgeInner: "rgba(255, 255, 255, 0.9)",
    badgeText: "rgba(15, 23, 42, 0.92)",
    overlay: null,
  },
  data: {
    energyDasharray: "10 18",
    energyOpacity: 1.1,
    haloScale: 1.2,
    flowSpeed: 0.9,
    markerScale: 0.8,
    strokeScale: 0.95,
    badgeOuter: "rgba(22, 163, 74, 0.38)",
    badgeInner: "rgba(240, 253, 244, 0.94)",
    badgeText: "rgba(20, 83, 45, 0.9)",
    overlay: "dashed",
  },
  image: {
    energyDasharray: "18 16",
    energyOpacity: 0.9,
    haloScale: 1,
    flowSpeed: 1.15,
    markerScale: 0.85,
    strokeScale: 1,
    badgeOuter: "rgba(30, 64, 175, 0.32)",
    badgeInner: "rgba(239, 246, 255, 0.94)",
    badgeText: "rgba(30, 64, 175, 0.92)",
    overlay: "matrix",
  },
  audio: {
    energyDasharray: "8 12",
    energyOpacity: 1.25,
    haloScale: 0.95,
    flowSpeed: 0.7,
    markerScale: 0.78,
    strokeScale: 0.92,
    badgeOuter: "rgba(194, 65, 12, 0.42)",
    badgeInner: "rgba(255, 247, 237, 0.92)",
    badgeText: "rgba(124, 45, 18, 0.9)",
    overlay: "pulses",
  },
  video: {
    energyDasharray: "22 18",
    energyOpacity: 0.95,
    haloScale: 1.1,
    flowSpeed: 1.35,
    markerScale: 0.88,
    strokeScale: 1.08,
    badgeOuter: "rgba(91, 33, 182, 0.36)",
    badgeInner: "rgba(245, 243, 255, 0.93)",
    badgeText: "rgba(91, 33, 182, 0.94)",
    overlay: "scanlines",
  },
};

export const resolveConnectionVariant = (context: ConnectionRenderContext): ConnectionVariant => {
  const fromType = primaryPortDataType(context.fromPort.dataType);
  if (isConnectionVariant(fromType)) {
    return fromType;
  }
  const toType = primaryPortDataType(context.toPort?.dataType);
  if (isConnectionVariant(toType)) {
    return toType;
  }
  return "default";
};
