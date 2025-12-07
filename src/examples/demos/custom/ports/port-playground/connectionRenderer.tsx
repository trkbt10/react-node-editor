/**
 * @file Advanced connection renderer variations used by the custom port example.
 */
import * as React from "react";
import type { Position } from "../../../../../types/core";
import type { ConnectionRenderContext } from "../../../../../types/NodeDefinition";
import { calculateConnectionControlPoints, calculateConnectionPath } from "../../../../../core/connection/path";
import { cubicBezierPoint, cubicBezierTangent } from "../../../../../core/geometry/curve";
import { getStyleForDataType } from "./dataStyles";
import { CONNECTION_VARIANT_TOKENS, type ConnectionVariant, resolveConnectionVariant } from "./connectionTokens";
import styles from "./CustomPortRendererExample.module.css";

type DefaultConnectionElementProps = {
  className?: string;
};

const clamp = (value: number): number => {
  return Math.max(0, Math.min(1, value));
};

const createSamplePoints = (
  context: ConnectionRenderContext,
  cp1: Position,
  cp2: Position,
): Array<{ position: Position; angle: number }> => {
  const count = 6;
  const points: Array<{ position: Position; angle: number }> = [];
  for (let index = 1; index <= count; index += 1) {
    const t = index / (count + 1);
    const position = cubicBezierPoint(context.fromPosition, cp1, cp2, context.toPosition, t);
    const tangent = cubicBezierTangent(context.fromPosition, cp1, cp2, context.toPosition, t);
    const angle = (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI;
    points.push({ position, angle });
  }
  return points;
};

const buildDataOverlay = (pathData: string, stroke: string): React.ReactElement => {
  return <path key="data-overlay" className={styles.connectionOverlayData} d={pathData} stroke={stroke} />;
};

const buildImageOverlay = (
  pathData: string,
  samplePoints: Array<{ position: Position; angle: number }>,
  fromStroke: string,
  toStroke: string,
): React.ReactElement => {
  return (
    <g key="image-overlay" className={styles.connectionOverlayImage}>
      <path d={pathData} fill="none" />
      {samplePoints.map((point, index) => {
        const size = 6 + (index % 2 === 0 ? 1.5 : -1.5);
        return (
          <rect
            key={`image-marker-${index}`}
            x={point.position.x - size / 2}
            y={point.position.y - size / 2}
            width={size}
            height={size}
            transform={`rotate(${point.angle}, ${point.position.x}, ${point.position.y})`}
            fill={index % 2 === 0 ? fromStroke : toStroke}
            fillOpacity={0.35}
            rx={1.2}
          />
        );
      })}
    </g>
  );
};

const buildAudioOverlay = (
  samplePoints: Array<{ position: Position; angle: number }>,
  fromAccent: string,
  toAccent: string,
): React.ReactElement => {
  return (
    <g key="audio-overlay" className={styles.connectionOverlayAudio}>
      {samplePoints.map((point, index) => {
        const radius = Math.max(1.4, 2.4 + Math.sin(index * 1.2) * 1.2);
        return (
          <circle
            key={`audio-marker-${index}`}
            cx={point.position.x}
            cy={point.position.y}
            r={radius}
            stroke={index % 2 === 0 ? fromAccent : toAccent}
            strokeWidth={0.9}
            strokeOpacity={0.55}
            fill="none"
          />
        );
      })}
    </g>
  );
};

const buildVideoOverlay = (
  pathData: string,
  mainStrokeWidth: number,
  fromAccent: string,
  toSecondary: string,
): React.ReactElement => {
  return (
    <g key="video-overlay" className={styles.connectionOverlayVideo}>
      <path
        d={pathData}
        stroke={fromAccent}
        strokeWidth={Math.max(1, mainStrokeWidth * 0.55)}
        strokeDasharray="2 6"
        strokeOpacity={0.42}
        fill="none"
      />
      <path
        d={pathData}
        stroke={toSecondary}
        strokeWidth={Math.max(0.8, mainStrokeWidth * 0.35)}
        strokeDasharray="1 4"
        strokeDashoffset={-6}
        strokeOpacity={0.55}
        fill="none"
      />
    </g>
  );
};

const buildOverlayElements = (
  variant: ConnectionVariant,
  pathData: string,
  samplePoints: Array<{ position: Position; angle: number }>,
  mainStrokeWidth: number,
  fromStyle: ReturnType<typeof getStyleForDataType>,
  toStyle: ReturnType<typeof getStyleForDataType>,
): React.ReactElement | null => {
  switch (variant) {
    case "data":
      return buildDataOverlay(pathData, fromStyle.secondary);
    case "image":
      return buildImageOverlay(pathData, samplePoints, fromStyle.secondary, toStyle.secondary);
    case "audio":
      return buildAudioOverlay(samplePoints, fromStyle.accent, toStyle.accent);
    case "video":
      return buildVideoOverlay(pathData, mainStrokeWidth, fromStyle.accent, toStyle.secondary);
    default:
      return null;
  }
};

export const createConnectionRenderer = (variant?: ConnectionVariant) => {
  return (context: ConnectionRenderContext, defaultRender: () => React.ReactElement): React.ReactElement => {
    const defaultElement = defaultRender() as React.ReactElement<DefaultConnectionElementProps>;
    const fromStyle = getStyleForDataType(context.fromPort.dataType);
    const toStyle = getStyleForDataType(context.toPort?.dataType ?? context.fromPort.dataType);

    const resolvedVariant = variant ?? resolveConnectionVariant(context);
    const tokens = CONNECTION_VARIANT_TOKENS[resolvedVariant];

    const pathData = React.useMemo(
      () => calculateConnectionPath(context.fromPosition, context.toPosition),
      [context.fromPosition.x, context.fromPosition.y, context.toPosition.x, context.toPosition.y],
    );

    const { cp1, cp2 } = React.useMemo(
      () => calculateConnectionControlPoints(context.fromPosition, context.toPosition),
      [context.fromPosition.x, context.fromPosition.y, context.toPosition.x, context.toPosition.y],
    );

    const midpoint = React.useMemo(() => {
      return cubicBezierPoint(context.fromPosition, cp1, cp2, context.toPosition, 0.5);
    }, [context.fromPosition, context.toPosition, cp1, cp2]);

    const tangent = React.useMemo(() => {
      return cubicBezierTangent(context.fromPosition, cp1, cp2, context.toPosition, 0.5);
    }, [context.fromPosition, context.toPosition, cp1, cp2]);

    const midAngle = React.useMemo(() => {
      return (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI;
    }, [tangent.x, tangent.y]);

    const distance = React.useMemo(() => {
      return Math.hypot(context.toPosition.x - context.fromPosition.x, context.toPosition.y - context.fromPosition.y);
    }, [context.fromPosition.x, context.fromPosition.y, context.toPosition.x, context.toPosition.y]);

    const baseStroke = 3.4 + (context.isSelected ? 0.9 : 0) + (context.isHovered ? 0.6 : 0);
    const mainStrokeWidth = baseStroke * tokens.strokeScale;
    const haloWidth = mainStrokeWidth + 4.5;
    const dragInfluence = clamp(context.dragProgress ?? 0);
    const haloOpacity = (0.28 + (context.isSelected ? 0.25 : 0) + dragInfluence * 0.4) * tokens.haloScale;
    const energyOpacity = (0.45 + (context.isHovered ? 0.25 : 0)) * tokens.energyOpacity;
    const flowDuration = Math.max(1.2, Math.min(2.8, distance / 160)) * tokens.flowSpeed;

    const gradientId = React.useId();
    const energyGradientId = React.useId();
    const haloGradientId = React.useId();
    const toPortId = context.toPort?.id ?? "floating";
    const connectionKey = React.useMemo(() => {
      return context.connection?.id ?? `preview-${context.phase}-${context.fromPort.id}-${toPortId}`;
    }, [context.connection?.id, context.phase, context.fromPort.id, toPortId]);
    const markerId = React.useMemo(() => {
      return `advanced-connection-arrow-${connectionKey}`;
    }, [connectionKey]);

    const samplePoints = React.useMemo(() => createSamplePoints(context, cp1, cp2), [context, cp1, cp2]);
    const overlayElements = React.useMemo(
      () => buildOverlayElements(resolvedVariant, pathData, samplePoints, mainStrokeWidth, fromStyle, toStyle),
      [resolvedVariant, pathData, samplePoints, mainStrokeWidth, fromStyle, toStyle],
    );

    const interactiveBase = React.cloneElement(defaultElement, {
      className: [styles.connectionInteractiveBase, defaultElement.props?.className].filter(Boolean).join(" "),
    });

    return (
      <>
        {interactiveBase}
        <g className={styles.connectionLayer} pointerEvents="none">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={fromStyle.primary} />
              <stop offset="45%" stopColor={fromStyle.accent} />
              <stop offset="55%" stopColor={toStyle.accent} />
              <stop offset="100%" stopColor={toStyle.primary} />
            </linearGradient>
            <linearGradient id={energyGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={fromStyle.secondary} stopOpacity={0.9} />
              <stop offset="100%" stopColor={toStyle.secondary} stopOpacity={0.35} />
            </linearGradient>
            <radialGradient id={haloGradientId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={fromStyle.accent} stopOpacity={haloOpacity} />
              <stop offset="100%" stopColor={toStyle.accent} stopOpacity={0} />
            </radialGradient>
            <marker
              id={markerId}
              viewBox="0 0 6 6"
              refX={6}
              refY={3}
              markerWidth={6 * tokens.markerScale}
              markerHeight={6 * tokens.markerScale}
              markerUnits="strokeWidth"
              orient="auto"
            >
              <path d="M 0 0 L 6 3 L 0 6 Z" fill={toStyle.primary} fillOpacity={0.9} />
            </marker>
          </defs>

          <path
            className={styles.connectionHaloPath}
            d={pathData}
            fill="none"
            stroke={`url(#${haloGradientId})`}
            strokeWidth={haloWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={haloOpacity}
          />
      <path
        className={styles.connectionMainPath}
        d={pathData}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={mainStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
        opacity={0.96}
      />
          <path
            className={styles.connectionEnergyPath}
            d={pathData}
            fill="none"
            stroke={`url(#${energyGradientId})`}
            strokeWidth={Math.max(1, mainStrokeWidth - 1.4)}
            strokeDasharray={tokens.energyDasharray}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={energyOpacity}
            style={{ animationDuration: `${flowDuration}s` }}
          />
          {overlayElements}

          <g
            className={styles.connectionBadge}
            transform={`translate(${midpoint.x}, ${midpoint.y}) rotate(${midAngle})`}
          >
            <rect x={-36} y={-12} width={72} height={24} rx={12} fill={tokens.badgeOuter} />
            <rect x={-34} y={-10} width={68} height={20} rx={10} fill={tokens.badgeInner} />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              letterSpacing="0.04em"
              fill={tokens.badgeText}
            >
              {`${fromStyle.label} → ${toStyle.label}`}
            </text>
          </g>
        </g>
      </>
    );
  };
};
