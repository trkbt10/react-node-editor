/**
 * @file Connection visual appearance definitions.
 * Pure data definitions for connection styling based on interaction state.
 */
import type { CSSProperties } from "react";
import type { MarkerShapeDimensions, MarkerShapeId } from "./marker";

export type ConnectionInteractionPhase =
  | "default"
  | "connecting"
  | "selected"
  | "disconnecting"
  | "disconnectingCritical";

export type ConnectionAdjacency = "self" | "adjacent";

export type ConnectionStripeStyle = {
  id: string;
  style: CSSProperties;
};

export type ConnectionVisualAppearance = {
  phase: ConnectionInteractionPhase;
  adjacency: ConnectionAdjacency;
  path: {
    style: CSSProperties;
  };
  stripes: readonly ConnectionStripeStyle[];
  direction: {
    style: CSSProperties;
  };
  arrowHead: {
    style: CSSProperties;
    shape: MarkerShapeId;
    dimensions: MarkerShapeDimensions;
    offset: number;
  };
};

export type ConnectionVisualAppearanceMap = Record<
  ConnectionInteractionPhase,
  Record<ConnectionAdjacency, ConnectionVisualAppearance>
>;

type ConnectionStripeVariant = {
  id: string;
  style: CSSProperties;
};

const PATH_BASE_STYLE: CSSProperties = {
  fill: "none",
  pointerEvents: "stroke",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  transition: "var(--node-editor-connection-base-transition)",
  vectorEffect: "non-scaling-stroke",
};

const STRIPE_BASE_STYLE: CSSProperties = {
  animation: "node-editor__connection-flow var(--node-editor-connection-flow-animation-duration) linear infinite",
  fill: "none",
  pointerEvents: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeDasharray: "var(--node-editor-connection-stripe-dash-array)",
  vectorEffect: "non-scaling-stroke",
};

const DIRECTION_BASE_STYLE: CSSProperties = {
  pointerEvents: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  vectorEffect: "non-scaling-stroke",
};

const ARROW_HEAD_BASE_STYLE: CSSProperties = {
  pointerEvents: "none",
  transition: "var(--node-editor-connection-arrow-transition)",
};

const STRIPE_VARIANTS: ReadonlyArray<ConnectionStripeVariant> = [
  {
    id: "accent",
    style: {
      stroke: "var(--node-editor-accent-color, #0066cc)",
      strokeOpacity: "var(--node-editor-connection-stripe-opacity-accent)",
    },
  },
  {
    id: "background",
    style: {
      stroke: "var(--node-editor-control-background, #ffffff)",
      strokeDashoffset: "var(--node-editor-connection-stripe-dash-offset-bg)",
      strokeOpacity: "var(--node-editor-connection-stripe-opacity-background)",
    },
  },
];

const createStripeStyles = (strokeWidth: number): ConnectionStripeStyle[] =>
  STRIPE_VARIANTS.map(({ id, style }) => ({
    id,
    style: {
      ...STRIPE_BASE_STYLE,
      ...style,
      strokeWidth,
    },
  }));

const STRIPES_NONE: readonly ConnectionStripeStyle[] = [];

const CONNECTION_COLOR = "var(--node-editor-connection-color, #999)";
const CONNECTION_ACCENT_COLOR = "var(--node-editor-accent-color, #0066cc)";
const CONNECTION_CAUTION_COLOR = "var(--node-editor-caution-color, #ff3b30)";

const PATH_WIDTH_DEFAULT = 3;
const PATH_WIDTH_ACTIVE = 3.5;
const STRIPE_WIDTH_DEFAULT = 1.5;
const STRIPE_WIDTH_ACTIVE = 2.5;
const DIRECTION_STROKE_WIDTH = 2;

const STRIPES_DEFAULT_WIDTH = createStripeStyles(STRIPE_WIDTH_DEFAULT);
const STRIPES_ACTIVE_WIDTH = createStripeStyles(STRIPE_WIDTH_ACTIVE);
const ARROW_HEAD_HALF_BASE = 4;
const ARROW_HEAD_DEPTH = Math.sqrt(3) * ARROW_HEAD_HALF_BASE;

const createArrowHeadAppearance = (
  fill: string,
  pathStyle: CSSProperties,
): ConnectionVisualAppearance["arrowHead"] => ({
  style: {
    ...ARROW_HEAD_BASE_STYLE,
    fill,
  },
  shape: "triangle",
  dimensions: {
    depth: ARROW_HEAD_DEPTH,
    halfBase: ARROW_HEAD_HALF_BASE,
  },
  offset: Number(pathStyle.strokeWidth ?? PATH_WIDTH_DEFAULT) / 2,
});

const createAppearanceEntry = (
  phase: ConnectionInteractionPhase,
  adjacency: ConnectionAdjacency,
  strokeColor: string,
  strokeWidth: number,
  stripes: readonly ConnectionStripeStyle[],
): ConnectionVisualAppearance => {
  const pathStyle: CSSProperties = {
    ...PATH_BASE_STYLE,
    stroke: strokeColor,
    strokeWidth,
  };

  return {
    phase,
    adjacency,
    path: { style: pathStyle },
    stripes,
    direction: {
      style: {
        ...DIRECTION_BASE_STYLE,
        stroke: strokeColor,
        strokeWidth: DIRECTION_STROKE_WIDTH,
        fill: strokeColor,
      },
    },
    arrowHead: createArrowHeadAppearance(strokeColor, pathStyle),
  };
};

export const CONNECTION_APPEARANCES: ConnectionVisualAppearanceMap = {
  default: {
    self: createAppearanceEntry("default", "self", CONNECTION_COLOR, PATH_WIDTH_DEFAULT, STRIPES_NONE),
    adjacent: createAppearanceEntry("default", "adjacent", CONNECTION_COLOR, PATH_WIDTH_DEFAULT, STRIPES_DEFAULT_WIDTH),
  },
  connecting: {
    self: createAppearanceEntry("connecting", "self", CONNECTION_ACCENT_COLOR, PATH_WIDTH_ACTIVE, STRIPES_NONE),
    adjacent: createAppearanceEntry(
      "connecting",
      "adjacent",
      CONNECTION_ACCENT_COLOR,
      PATH_WIDTH_ACTIVE,
      STRIPES_ACTIVE_WIDTH,
    ),
  },
  selected: {
    self: createAppearanceEntry("selected", "self", CONNECTION_ACCENT_COLOR, PATH_WIDTH_ACTIVE, STRIPES_ACTIVE_WIDTH),
    adjacent: createAppearanceEntry(
      "selected",
      "adjacent",
      CONNECTION_ACCENT_COLOR,
      PATH_WIDTH_ACTIVE,
      STRIPES_ACTIVE_WIDTH,
    ),
  },
  disconnecting: {
    self: createAppearanceEntry("disconnecting", "self", CONNECTION_COLOR, PATH_WIDTH_DEFAULT, STRIPES_NONE),
    adjacent: createAppearanceEntry(
      "disconnecting",
      "adjacent",
      CONNECTION_COLOR,
      PATH_WIDTH_DEFAULT,
      STRIPES_DEFAULT_WIDTH,
    ),
  },
  disconnectingCritical: {
    self: createAppearanceEntry(
      "disconnectingCritical",
      "self",
      CONNECTION_CAUTION_COLOR,
      PATH_WIDTH_DEFAULT,
      STRIPES_NONE,
    ),
    adjacent: createAppearanceEntry(
      "disconnectingCritical",
      "adjacent",
      CONNECTION_CAUTION_COLOR,
      PATH_WIDTH_DEFAULT,
      STRIPES_DEFAULT_WIDTH,
    ),
  },
};

type ConnectionVisualInputs = {
  isDragging?: boolean;
  dragProgress: number;
  isSelected: boolean;
  isHovered: boolean;
};

export const determineConnectionInteractionPhase = (input: ConnectionVisualInputs): ConnectionInteractionPhase => {
  if (input.isDragging && input.dragProgress > 0) {
    return input.dragProgress > 0.5 ? "disconnectingCritical" : "disconnecting";
  }
  if (input.isSelected) {
    return "selected";
  }
  if (input.isHovered) {
    return "connecting";
  }
  return "default";
};
