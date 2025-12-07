/**
 * @file Custom connection renderer with a luminous ribbon aesthetic and lightweight SVG animation.
 */
import * as React from "react";
import type { ConnectionRenderContext } from "../../../../../types/NodeDefinition";
import { calculateConnectionControlPoints, calculateConnectionPath } from "../../../../../core/connection/path";
import { cubicBezierPoint } from "../../../../../core/geometry/curve";
import styles from "./CustomConnectorExample.module.css";

type VisualPhase = "idle" | "hovered" | "active";

type Point = { x: number; y: number };

type GradientStop = {
  offset: string;
  color: string;
  opacity?: number;
};

type PhaseBase = {
  gradient: GradientStop[];
  haloColor: string;
  haloOpacity: number;
  flowColor: string;
  flowOpacity: number;
  sparkColor: string;
  sparkOpacity: number;
  sparkRadius: number;
  haloWidth: number;
  coreWidth: number;
  flowWidth: number;
  hitWidth: number;
  baseSpeed: number;
};

type PhaseAppearance = PhaseBase & {
  speed: number;
};

type Bounds = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

const SPARK_COUNT = 3;
const BOUNDS_PADDING = 140;

const PHASE_BASE: Record<VisualPhase, PhaseBase> = {
  idle: {
    gradient: [
      { offset: "0%", color: "#38bdf8", opacity: 0.92 },
      { offset: "40%", color: "#22d3ee", opacity: 0.9 },
      { offset: "72%", color: "#a855f7", opacity: 0.85 },
      { offset: "100%", color: "#f472b6", opacity: 0.88 },
    ],
    haloColor: "rgba(56, 189, 248, 0.32)",
    haloOpacity: 0.55,
    flowColor: "rgba(224, 242, 254, 0.78)",
    flowOpacity: 0.52,
    sparkColor: "rgba(165, 243, 252, 0.95)",
    sparkOpacity: 0.75,
    sparkRadius: 3.6,
    haloWidth: 18,
    coreWidth: 6.5,
    flowWidth: 2.2,
    hitWidth: 24,
    baseSpeed: 0.35,
  },
  hovered: {
    gradient: [
      { offset: "0%", color: "#22d3ee", opacity: 0.95 },
      { offset: "46%", color: "#38bdf8", opacity: 0.95 },
      { offset: "72%", color: "#8b5cf6", opacity: 0.92 },
      { offset: "100%", color: "#f472b6", opacity: 0.92 },
    ],
    haloColor: "rgba(56, 189, 248, 0.45)",
    haloOpacity: 0.7,
    flowColor: "rgba(240, 249, 255, 0.9)",
    flowOpacity: 0.72,
    sparkColor: "rgba(244, 114, 182, 0.95)",
    sparkOpacity: 0.85,
    sparkRadius: 4.3,
    haloWidth: 22,
    coreWidth: 7.2,
    flowWidth: 2.6,
    hitWidth: 26,
    baseSpeed: 0.52,
  },
  active: {
    gradient: [
      { offset: "0%", color: "#2dd4bf", opacity: 0.98 },
      { offset: "36%", color: "#38bdf8", opacity: 0.96 },
      { offset: "72%", color: "#8b5cf6", opacity: 0.95 },
      { offset: "100%", color: "#f97316", opacity: 0.98 },
    ],
    haloColor: "rgba(45, 212, 191, 0.55)",
    haloOpacity: 0.85,
    flowColor: "rgba(248, 250, 252, 0.95)",
    flowOpacity: 0.86,
    sparkColor: "rgba(251, 191, 36, 0.92)",
    sparkOpacity: 0.92,
    sparkRadius: 4.9,
    haloWidth: 26,
    coreWidth: 8.3,
    flowWidth: 3,
    hitWidth: 30,
    baseSpeed: 0.74,
  },
};

const computeBounds = (from: Point, to: Point, cp1: Point, cp2: Point): Bounds => {
  const minX = Math.min(from.x, to.x, cp1.x, cp2.x);
  const maxX = Math.max(from.x, to.x, cp1.x, cp2.x);
  const minY = Math.min(from.y, to.y, cp1.y, cp2.y);
  const maxY = Math.max(from.y, to.y, cp1.y, cp2.y);

  return {
    minX,
    minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
};

const buildAppearance = (
  phase: VisualPhase,
  interactionBoost: number,
): PhaseAppearance => {
  const base = PHASE_BASE[phase];
  const multiplier = 1 + interactionBoost;

  return {
    ...base,
    haloOpacity: Math.min(1, base.haloOpacity + interactionBoost * 0.4),
    flowOpacity: Math.min(1, base.flowOpacity + interactionBoost * 0.45),
    sparkOpacity: Math.min(1, base.sparkOpacity + interactionBoost * 0.5),
    sparkRadius: base.sparkRadius * (1 + interactionBoost * 0.5),
    haloWidth: base.haloWidth * multiplier,
    coreWidth: base.coreWidth * (1 + interactionBoost * 0.35),
    flowWidth: base.flowWidth * (1 + interactionBoost * 0.3),
    hitWidth: base.hitWidth * (1 + interactionBoost * 0.2),
    speed: base.baseSpeed * (1 + interactionBoost * 0.9),
  };
};

const getInteractionBoost = (
  isSelected: boolean,
  isHovered: boolean,
  isAdjacent: boolean | undefined,
  phase: ConnectionRenderContext["phase"],
): number => {
  if (phase === "disconnecting") {
    return 0.45;
  }
  if (isSelected) {
    return 0.4;
  }
  if (isHovered || phase === "connecting") {
    return 0.28;
  }
  if (isAdjacent) {
    return 0.14;
  }
  return 0;
};

const sparkOffsets = Array.from({ length: SPARK_COUNT }, (_value, index) => index / SPARK_COUNT);

export const bezierConnectionRenderer = (
  context: ConnectionRenderContext,
  defaultRender: () => React.ReactElement,
): React.ReactElement => {
  const defaultElement = defaultRender();
  const hitElement = React.isValidElement(defaultElement) ? <g style={{ opacity: 0 }}>{defaultElement}</g> : defaultElement;

  const {
    fromPort: _fromPort,
    toPort: _toPort,
    fromPosition,
    toPosition,
    isSelected,
    isHovered,
    isAdjacentToSelectedNode,
    handlers,
    phase,
  } = context;

  const { cp1, cp2 } = React.useMemo(
    () => calculateConnectionControlPoints(fromPosition, toPosition),
    [fromPosition.x, fromPosition.y, toPosition.x, toPosition.y],
  );

  const pathData = React.useMemo(
    () => calculateConnectionPath(fromPosition, toPosition),
    [fromPosition.x, fromPosition.y, toPosition.x, toPosition.y],
  );

  const bounds = React.useMemo(
    () => computeBounds(fromPosition, toPosition, cp1, cp2),
    [fromPosition.x, fromPosition.y, toPosition.x, toPosition.y, cp1.x, cp1.y, cp2.x, cp2.y],
  );

  const phaseKey: VisualPhase = React.useMemo(() => {
    if (phase === "disconnecting" || isSelected) {
      return "active";
    }
    if (phase === "connecting" || isHovered) {
      return "hovered";
    }
    return "idle";
  }, [isHovered, isSelected, phase]);

  const appearance = React.useMemo(
    () => buildAppearance(phaseKey, getInteractionBoost(isSelected, isHovered, isAdjacentToSelectedNode, phase)),
    [phaseKey, isSelected, isHovered, isAdjacentToSelectedNode, phase],
  );

  const glowFilterId = React.useId();
  const coreGradientId = React.useId();
  const flowGradientId = React.useId();
  const sparkGradientId = React.useId();

  const flowPathRef = React.useRef<SVGPathElement | null>(null);
  const sparkRefs = React.useRef<Array<SVGCircleElement | null>>([]);
  const animationState = React.useRef<{ start: number; pathLength: number; frameId: number | null }>({
    start: 0,
    pathLength: 1,
    frameId: null,
  });

  React.useEffect(() => {
    const flowPath = flowPathRef.current;
    const state = animationState.current;
    state.start = performance.now();

    if (flowPath) {
      const length = flowPath.getTotalLength();
      state.pathLength = length || 1;
      flowPath.style.strokeDasharray = `${state.pathLength} ${state.pathLength}`;
      flowPath.style.strokeDashoffset = `${state.pathLength}`;
    }

    const run = (timestamp: number) => {
      const elapsed = (timestamp - state.start) / 1000;
      const normalized = elapsed * appearance.speed;

      if (flowPath) {
        const dashOffset = state.pathLength - ((normalized % 1) * state.pathLength);
        flowPath.style.strokeDashoffset = `${dashOffset}`;
      }

      sparkRefs.current.forEach((spark, index) => {
        if (!spark) {
          return;
        }
        const offset = (normalized + sparkOffsets[index]) % 1;
        const position = cubicBezierPoint(fromPosition, cp1, cp2, toPosition, offset);
        spark.setAttribute("cx", position.x.toFixed(2));
        spark.setAttribute("cy", position.y.toFixed(2));
      });

      state.frameId = requestAnimationFrame(run);
    };

    state.frameId = requestAnimationFrame(run);

    return () => {
      if (state.frameId !== null) {
        cancelAnimationFrame(state.frameId);
        state.frameId = null;
      }
    };
  }, [
    appearance.speed,
    fromPosition.x,
    fromPosition.y,
    toPosition.x,
    toPosition.y,
    cp1.x,
    cp1.y,
    cp2.x,
    cp2.y,
    pathData,
  ]);

  React.useEffect(() => {
    sparkRefs.current = sparkRefs.current.slice(0, SPARK_COUNT);
  }, []);

  const filterX = bounds.minX - BOUNDS_PADDING;
  const filterY = bounds.minY - BOUNDS_PADDING;
  const filterWidth = bounds.width + BOUNDS_PADDING * 2;
  const filterHeight = bounds.height + BOUNDS_PADDING * 2;

  return (
    <g className={styles.connectorGroup}>
      <defs>
        <filter
          id={glowFilterId}
          x={filterX}
          y={filterY}
          width={filterWidth}
          height={filterHeight}
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation={appearance.haloWidth * 0.7} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient
          id={coreGradientId}
          gradientUnits="userSpaceOnUse"
          x1={fromPosition.x}
          y1={fromPosition.y}
          x2={toPosition.x}
          y2={toPosition.y}
        >
          {appearance.gradient.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity ?? 1} />
          ))}
        </linearGradient>

        <linearGradient
          id={flowGradientId}
          gradientUnits="userSpaceOnUse"
          x1={fromPosition.x}
          y1={fromPosition.y}
          x2={toPosition.x}
          y2={toPosition.y}
        >
          <stop offset="0%" stopColor={appearance.flowColor} stopOpacity={appearance.flowOpacity} />
          <stop offset="100%" stopColor={appearance.flowColor} stopOpacity={appearance.flowOpacity * 0.35} />
        </linearGradient>

        <radialGradient id={sparkGradientId}>
          <stop offset="0%" stopColor={appearance.sparkColor} stopOpacity={appearance.sparkOpacity} />
          <stop offset="100%" stopColor={appearance.sparkColor} stopOpacity={0} />
        </radialGradient>
      </defs>

      <path
        d={pathData}
        className={styles.connectorHalo}
        stroke={appearance.haloColor}
        strokeWidth={appearance.haloWidth}
        opacity={appearance.haloOpacity}
        filter={`url(#${glowFilterId})`}
      />

      <path
        d={pathData}
        className={styles.connectorCore}
        stroke={`url(#${coreGradientId})`}
        strokeWidth={appearance.coreWidth}
      />

      <path
        ref={flowPathRef}
        d={pathData}
        className={styles.connectorFlow}
        stroke={`url(#${flowGradientId})`}
        strokeWidth={appearance.flowWidth}
        opacity={appearance.flowOpacity}
      />

      <g className={styles.connectorSparkLayer}>
        {sparkOffsets.map((offset, index) => (
          <circle
            key={offset}
            ref={(element) => {
              sparkRefs.current[index] = element;
            }}
            r={appearance.sparkRadius}
            fill={`url(#${sparkGradientId})`}
            opacity={appearance.sparkOpacity}
            data-spark-index={index}
          />
        ))}
      </g>

      <path
        d={pathData}
        className={styles.connectorHitArea}
        strokeWidth={appearance.hitWidth}
        onPointerDown={handlers.onPointerDown}
        onPointerEnter={handlers.onPointerEnter}
        onPointerLeave={handlers.onPointerLeave}
        onContextMenu={handlers.onContextMenu}
      />

      {hitElement}
    </g>
  );
};
