/**
 * @file Example demonstrating advanced custom port and connection rendering
 */
import * as React from "react";
import { NodeEditor } from "../../NodeEditor";
import {
  createNodeDefinition,
  toUntypedDefinition,
  type ConnectionRenderContext,
  type PortRenderContext,
} from "../../types/NodeDefinition";
import type { Connection, NodeEditorData, Position } from "../../types/core";
import {
  calculateBezierPath,
  calculateBezierControlPoints,
  cubicBezierPoint,
  cubicBezierTangent,
} from "../../components/connection/utils/connectionUtils";
import classes from "./CustomPortRendererExample.module.css";

type DataTypeStyle = {
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

const getStyleForDataType = (dataType?: string): DataTypeStyle => {
  return DATA_TYPE_STYLES[dataType ?? ""] ?? DEFAULT_DATA_STYLE;
};

const clamp = (value: number): number => {
  return Math.max(0, Math.min(1, value));
};

const calculateConnectionsForPort = (
  allConnections: Record<string, Connection>,
  portId: string,
): number => {
  return Object.values(allConnections).filter((connection) => {
    return connection.fromPortId === portId || connection.toPortId === portId;
  }).length;
};

type ConnectionVariant = "default" | "data" | "image" | "audio" | "video";

const isConnectionVariant = (value: string | undefined): value is ConnectionVariant => {
  return value === "data" || value === "image" || value === "audio" || value === "video" || value === "default";
};

type ConnectionOverlayVariant = "dashed" | "matrix" | "pulses" | "scanlines" | null;

type ConnectionVariantTokens = {
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

const CONNECTION_VARIANT_TOKENS: Record<ConnectionVariant, ConnectionVariantTokens> = {
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

type AdvancedPortRendererProps = {
  context: PortRenderContext;
  defaultRender: () => React.ReactElement;
};

const AdvancedPortRenderer: React.FC<AdvancedPortRendererProps> = ({ context, defaultRender }) => {
  const defaultElement = React.useMemo(() => defaultRender(), [defaultRender]);
  if (!React.isValidElement(defaultElement)) {
    return defaultElement;
  }

  const {
    port,
    position,
    handlers,
    allConnections,
    isHovered,
    isConnected,
    isCandidate,
    isConnectable,
    isConnecting,
  } = context;

  if (!position) {
    return defaultElement;
  }

  const dataStyle = getStyleForDataType(port.dataType);
  const connectionCount = React.useMemo(() => {
    return calculateConnectionsForPort(allConnections, port.id);
  }, [allConnections, port.id]);

  const maxConnections = port.maxConnections === "unlimited" ? Math.max(connectionCount, 1) : port.maxConnections ?? 1;
  const utilization = connectionCount === 0 ? 0 : clamp(connectionCount / maxConnections);
  const interactiveState = isCandidate
    ? "candidate"
    : isConnectable
      ? "connectable"
      : isHovered
        ? "hovered"
        : isConnected
          ? "connected"
          : "idle";

  const portSize = React.useMemo(() => {
    const base = 28;
    if (isCandidate) {return base + 6;}
    if (isHovered) {return base + 4;}
    if (isConnectable) {return base + 2;}
    if (isConnected) {return base + 1;}
    return base;
  }, [isCandidate, isConnectable, isConnected, isHovered]);

  const badgeOffsetTransform = React.useMemo(() => {
    switch (port.position) {
      case "left":
        return "translateX(-16%)";
      case "right":
        return "translateX(16%)";
      case "top":
        return "translateY(-10%)";
      case "bottom":
        return "translateY(10%)";
      default:
        return "translateX(0)";
    }
  }, [port.position]);

  const badgeScale = React.useMemo(() => {
    if (isCandidate) {return 1.12;}
    if (isConnectable) {return 1.08;}
    if (isHovered) {return 1.04;}
    if (isConnected) {return 1.02;}
    return 1;
  }, [isCandidate, isConnectable, isConnected, isHovered]);

  const glyphGradientId = React.useId();
  const haloGradientId = React.useId();
  const directionGradientId = React.useId();
  const directionPath = React.useMemo(() => {
    if (port.type === "input") {
      return "M 12 26 L 24 14 L 24 20 L 40 20 L 40 32 L 24 32 L 24 38 Z";
    }
    return "M 40 26 L 28 14 L 28 20 L 12 20 L 12 32 L 28 32 L 28 38 Z";
  }, [port.type]);
  const directionGradientStops = React.useMemo(() => {
    if (port.type === "input") {
      return { start: "rgba(59, 130, 246, 0.7)", end: "rgba(59, 130, 246, 0.05)" };
    }
    return { start: "rgba(249, 115, 22, 0.7)", end: "rgba(249, 115, 22, 0.05)" };
  }, [port.type]);
  const typeLabel = port.type === "input" ? "IN" : "OUT";

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {return;}
    const pixelRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const renderSize = Math.max(1, Math.round(portSize * pixelRatio));
    if (canvasElement.width !== renderSize || canvasElement.height !== renderSize) {
      canvasElement.width = renderSize;
      canvasElement.height = renderSize;
    }
    canvasElement.style.width = `${portSize}px`;
    canvasElement.style.height = `${portSize}px`;

    const context2d = canvasElement.getContext("2d");
    if (!context2d) {return;}

    context2d.setTransform(1, 0, 0, 1, 0, 0);
    context2d.clearRect(0, 0, renderSize, renderSize);
    context2d.scale(pixelRatio, pixelRatio);

    const centerX = portSize / 2;
    const centerY = portSize / 2;
    const outerRadius = portSize / 2 - 2;
    const innerRadius = outerRadius * 0.62;
    const sweep = Math.PI * 2 * Math.max(utilization, isCandidate ? 0.35 : 0.18);

    context2d.lineCap = "round";

    context2d.globalAlpha = 0.55;
    context2d.strokeStyle = dataStyle.secondary;
    context2d.lineWidth = Math.max(outerRadius - innerRadius, 4);
    context2d.beginPath();
    context2d.arc(centerX, centerY, outerRadius - context2d.lineWidth / 2, -Math.PI / 2, -Math.PI / 2 + sweep, false);
    context2d.stroke();

    const tickCount = Math.max(6, Math.min(24, connectionCount * 4 || 8));
    const tickIndices = Array.from({ length: tickCount }, (_value, index) => index);
    context2d.globalAlpha = 0.35 + (isHovered ? 0.25 : 0);
    context2d.strokeStyle = dataStyle.accent;
    context2d.lineWidth = 2;
    tickIndices.forEach((index) => {
      const progress = index / tickCount;
      const angle = -Math.PI / 2 + progress * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const startRadius = innerRadius + 2;
      const endRadius = outerRadius - 3;
      context2d.beginPath();
      context2d.moveTo(centerX + cos * startRadius, centerY + sin * startRadius);
      context2d.lineTo(centerX + cos * endRadius, centerY + sin * endRadius);
      context2d.stroke();
    });

    context2d.globalAlpha = 0.25;
    context2d.fillStyle = dataStyle.primary;
    context2d.beginPath();
    context2d.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    context2d.fill();

    context2d.setTransform(1, 0, 0, 1, 0, 0);
  }, [connectionCount, dataStyle.accent, dataStyle.primary, dataStyle.secondary, isCandidate, isHovered, portSize, utilization]);

  const className = [defaultElement.props.className, classes.portAnchor].filter(Boolean).join(" ");
  const baseStyle = (defaultElement.props.style ?? {}) as React.CSSProperties;

  return React.cloneElement(
    defaultElement,
    {
      className,
      style: {
        ...baseStyle,
        background: "transparent",
        border: "none",
      },
      title: port.label,
      onPointerDown: handlers.onPointerDown,
      onPointerUp: handlers.onPointerUp,
      onPointerEnter: handlers.onPointerEnter,
      onPointerLeave: handlers.onPointerLeave,
      children: (
        <>
          <div
            className={classes.portBadgeWrapper}
            data-port-state={interactiveState}
            data-port-type={port.type}
            style={{
              width: portSize,
              height: portSize,
              transform: `translate(-50%, -50%) ${badgeOffsetTransform} scale(${badgeScale})`,
            }}
          >
            <svg
              className={classes.portBadgeSvg}
              viewBox="0 0 52 52"
              role="presentation"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id={haloGradientId} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={dataStyle.accent} stopOpacity={0.78} />
                  <stop offset="65%" stopColor={dataStyle.secondary} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={dataStyle.secondary} stopOpacity={0} />
                </radialGradient>
                <linearGradient id={glyphGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={dataStyle.primary} stopOpacity={0.88} />
                  <stop offset="100%" stopColor={dataStyle.accent} stopOpacity={0.97} />
                </linearGradient>
                <linearGradient id={directionGradientId} x1={port.type === "input" ? "0%" : "100%"} y1="50%" x2={port.type === "input" ? "100%" : "0%"} y2="50%">
                  <stop offset="0%" stopColor={directionGradientStops.start} />
                  <stop offset="100%" stopColor={directionGradientStops.end} />
                </linearGradient>
              </defs>
              <circle
                className={classes.portBadgeHalo}
                cx="26"
                cy="26"
                r="24"
                fill={`url(#${haloGradientId})`}
              />
              <path
                className={classes.portDirectionPath}
                d={directionPath}
                fill={`url(#${directionGradientId})`}
              />
              <circle
                className={classes.portBadgeCore}
                cx="26"
                cy="26"
                r="16"
                fill={`url(#${glyphGradientId})`}
              />
              <circle
                cx="26"
                cy="26"
                r={10 + utilization * 4}
                fill="none"
                stroke={dataStyle.accent}
                strokeWidth={2}
                strokeOpacity={0.6 + (isHovered ? 0.3 : 0)}
              />
              <path
                className={classes.portBadgeIcon}
                d={dataStyle.iconPath}
                stroke={dataStyle.secondary}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <text
                className={classes.portTypeGlyph}
                x="26"
                y="30"
                textAnchor="middle"
                fontSize="10"
                fontWeight={700}
                letterSpacing="0.08em"
              >
                {typeLabel}
              </text>
            </svg>
            <canvas ref={canvasRef} className={classes.portBadgeCanvas} />
          </div>
          {port.label ? (
            <span
              className={classes.portLabel}
              data-port-label-position={port.position}
              data-port-type={port.type}
            >
              {port.label}
            </span>
          ) : null}
        </>
      ),
      "data-port-connectable": isConnectable,
      "data-port-candidate": isCandidate,
      "data-port-hovered": isHovered,
      "data-port-connected": isConnected,
      "data-port-connecting": isConnecting,
    },
  );
};

type AdvancedConnectionRendererProps = {
  context: ConnectionRenderContext;
  defaultRender: () => React.ReactElement;
  variant?: ConnectionVariant;
};

const AdvancedConnectionRenderer: React.FC<AdvancedConnectionRendererProps> = ({ context, defaultRender, variant }) => {
  const defaultElement = React.useMemo(() => defaultRender(), [defaultRender]);

  const fromStyle = getStyleForDataType(context.fromPort.dataType);
  const toStyle = getStyleForDataType(context.toPort.dataType);

  const resolvedVariant: ConnectionVariant = variant ?? (isConnectionVariant(context.fromPort.dataType) ? (context.fromPort.dataType as ConnectionVariant) : "default");
  const variantTokens = CONNECTION_VARIANT_TOKENS[resolvedVariant] ?? CONNECTION_VARIANT_TOKENS.default;

  const pathData = React.useMemo(() => {
    return calculateBezierPath(
      context.fromPosition,
      context.toPosition,
      context.fromPort.position,
      context.toPort.position,
    );
  }, [
    context.fromPosition.x,
    context.fromPosition.y,
    context.toPosition.x,
    context.toPosition.y,
    context.fromPort.position,
    context.toPort.position,
  ]);

  const { cp1, cp2 } = React.useMemo(() => {
    return calculateBezierControlPoints(
      context.fromPosition,
      context.toPosition,
      context.fromPort.position,
      context.toPort.position,
    );
  }, [
    context.fromPosition.x,
    context.fromPosition.y,
    context.toPosition.x,
    context.toPosition.y,
    context.fromPort.position,
    context.toPort.position,
  ]);

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
  const mainStrokeWidth = baseStroke * variantTokens.strokeScale;
  const haloWidth = mainStrokeWidth + 4.5;
  const dragInfluence = clamp(context.dragProgress ?? 0);
  const baseHaloOpacity = 0.28 + (context.isSelected ? 0.25 : 0) + dragInfluence * 0.4;
  const haloOpacity = baseHaloOpacity * variantTokens.haloScale;
  const energyOpacity = (0.45 + (context.isHovered ? 0.25 : 0)) * variantTokens.energyOpacity;
  const flowDuration = Math.max(1.2, Math.min(2.8, distance / 160)) * variantTokens.flowSpeed;

  const gradientId = React.useId();
  const energyGradientId = React.useId();
  const haloGradientId = React.useId();
  const markerId = React.useMemo(() => {
    return `advanced-connection-arrow-${context.connection.id}`;
  }, [context.connection.id]);

  const samplePoints = React.useMemo(() => {
    const count = 6;
    const points: Array<{ position: Position; angle: number }> = [];
    for (let index = 1; index <= count; index += 1) {
      const t = index / (count + 1);
      const point = cubicBezierPoint(context.fromPosition, cp1, cp2, context.toPosition, t);
      const tangentAtPoint = cubicBezierTangent(context.fromPosition, cp1, cp2, context.toPosition, t);
      const angle = (Math.atan2(tangentAtPoint.y, tangentAtPoint.x) * 180) / Math.PI;
      points.push({ position: point, angle });
    }
    return points;
  }, [context.fromPosition, context.toPosition, cp1, cp2]);

  const overlayElements = React.useMemo(() => {
    switch (variantTokens.overlay) {
      case "dashed":
        return (
          <path
            key="data-overlay"
            className={classes.connectionOverlayData}
            d={pathData}
            stroke={fromStyle.secondary}
          />
        );
      case "matrix":
        return (
          <g key="image-overlay" className={classes.connectionOverlayImage}>
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
                  fill={index % 2 === 0 ? fromStyle.secondary : toStyle.secondary}
                  fillOpacity={0.35}
                  rx={1.2}
                />
              );
            })}
          </g>
        );
      case "pulses":
        return (
          <g key="audio-overlay" className={classes.connectionOverlayAudio}>
            {samplePoints.map((point, index) => {
              const radius = Math.max(1.4, 2.4 + Math.sin(index * 1.2) * 1.2);
              return (
                <circle
                  key={`audio-marker-${index}`}
                  cx={point.position.x}
                  cy={point.position.y}
                  r={radius}
                  stroke={index % 2 === 0 ? fromStyle.accent : toStyle.accent}
                  strokeWidth={0.9}
                  strokeOpacity={0.55}
                  fill="none"
                />
              );
            })}
          </g>
        );
      case "scanlines":
        return (
          <g key="video-overlay" className={classes.connectionOverlayVideo}>
            <path
              d={pathData}
              stroke={fromStyle.accent}
              strokeWidth={Math.max(1, mainStrokeWidth * 0.55)}
              strokeDasharray="2 6"
              strokeOpacity={0.42}
              fill="none"
            />
            <path
              d={pathData}
              stroke={toStyle.secondary}
              strokeWidth={Math.max(0.8, mainStrokeWidth * 0.35)}
              strokeDasharray="1 4"
              strokeDashoffset={-6}
              strokeOpacity={0.55}
              fill="none"
            />
          </g>
        );
      default:
        return null;
    }
  }, [variantTokens.overlay, pathData, samplePoints, fromStyle.secondary, fromStyle.accent, toStyle.secondary, mainStrokeWidth]);

  const markerScale = variantTokens.markerScale;
  const markerWidth = 6 * markerScale;
  const markerHeight = 6 * markerScale;

  const interactiveBase = React.isValidElement(defaultElement)
    ? React.cloneElement(defaultElement, {
        className: [classes.connectionInteractiveBase, defaultElement.props.className].filter(Boolean).join(" "),
      })
    : defaultElement;

  const connectionLabel = `${fromStyle.label} → ${toStyle.label}`;

  return (
    <>
      {interactiveBase}
      <g className={classes.connectionLayer} pointerEvents="none">
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
            markerWidth={markerWidth}
            markerHeight={markerHeight}
            markerUnits="strokeWidth"
            orient="auto"
          >
            <path
              d="M 0 0 L 6 3 L 0 6 Z"
              fill={toStyle.primary}
              fillOpacity={0.9}
            />
          </marker>
        </defs>

        <path
          className={classes.connectionHaloPath}
          d={pathData}
          fill="none"
          stroke={`url(#${haloGradientId})`}
          strokeWidth={haloWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={haloOpacity}
        />
        <path
          className={classes.connectionMainPath}
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
          className={classes.connectionEnergyPath}
          d={pathData}
          fill="none"
          stroke={`url(#${energyGradientId})`}
          strokeWidth={Math.max(1, mainStrokeWidth - 1.4)}
          strokeDasharray={variantTokens.energyDasharray}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={energyOpacity}
          style={{ animationDuration: `${flowDuration}s` }}
        />
        {overlayElements}

        <g
          className={classes.connectionBadge}
          transform={`translate(${midpoint.x}, ${midpoint.y}) rotate(${midAngle})`}
        >
          <rect
            x={-36}
            y={-12}
            width={72}
            height={24}
            rx={12}
            fill={variantTokens.badgeOuter}
          />
          <rect
            x={-34}
            y={-10}
            width={68}
            height={20}
            rx={10}
            fill={variantTokens.badgeInner}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            letterSpacing="0.04em"
            fill={variantTokens.badgeText}
          >
            {connectionLabel}
          </text>
        </g>
      </g>
    </>
  );
};

// Custom port renderer example using advanced SVG and canvas rendering
const customPortRenderer = (context: PortRenderContext, defaultRender: () => React.ReactElement) => {
  return <AdvancedPortRenderer context={context} defaultRender={defaultRender} />;
};

const createConnectionRendererForVariant = (variant: ConnectionVariant) => {
  return (context: ConnectionRenderContext, defaultRender: () => React.ReactElement) => {
    return <AdvancedConnectionRenderer context={context} defaultRender={defaultRender} variant={variant} />;
  };
};

const connectionRendererByDataType: Record<string, (context: ConnectionRenderContext, defaultRender: () => React.ReactElement) => React.ReactElement> = {
  data: createConnectionRendererForVariant("data"),
  image: createConnectionRendererForVariant("image"),
  audio: createConnectionRendererForVariant("audio"),
  video: createConnectionRendererForVariant("video"),
  default: createConnectionRendererForVariant("default"),
};

const getConnectionRenderer = (dataType?: string) => {
  if (isConnectionVariant(dataType)) {
    return connectionRendererByDataType[dataType];
  }
  return connectionRendererByDataType.default;
};

// Define custom node types with advanced renderers
const dataSourceNode = createNodeDefinition({
  type: "data-source",
  displayName: "Data Source",
  description: "Structured capture stream with paired telemetry",
  category: "Custom",
  defaultData: {
    title: "Data Source",
  },
  defaultSize: { width: 220, height: 140 },
  ports: [
    {
      id: "output-frame",
      type: "output",
      label: "Frames",
      position: "right",
      dataType: "image",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("image"),
    },
    {
      id: "output-telemetry",
      type: "output",
      label: "Telemetry",
      position: "bottom",
      dataType: "data",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("data"),
    },
  ],
});

const imageProcessorNode = createNodeDefinition({
  type: "image-processor",
  displayName: "Image Processor",
  description: "Applies inference and enhancement to image streams",
  category: "Custom",
  defaultData: {
    title: "Image Processor",
  },
  defaultSize: { width: 240, height: 170 },
  ports: [
    {
      id: "input-image",
      type: "input",
      label: "Image In",
      position: "left",
      dataType: "image",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("image"),
    },
    {
      id: "input-settings",
      type: "input",
      label: "Settings",
      position: "top",
      dataType: "data",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("data"),
    },
    {
      id: "output-image",
      type: "output",
      label: "Enhanced Image",
      position: "right",
      dataType: "image",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("image"),
    },
    {
      id: "output-data",
      type: "output",
      label: "Metadata",
      position: "bottom",
      dataType: "data",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("data"),
    },
  ],
});

const audioProcessorNode = createNodeDefinition({
  type: "audio-processor",
  displayName: "Audio Processor",
  description: "Synthesizes and routes audio channels",
  category: "Custom",
  defaultData: {
    title: "Audio Processor",
  },
  defaultSize: { width: 220, height: 140 },
  ports: [
    {
      id: "input-audio",
      type: "input",
      label: "Audio In",
      position: "left",
      dataType: "audio",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("audio"),
    },
    {
      id: "output-audio",
      type: "output",
      label: "Spatial Audio",
      position: "right",
      dataType: "audio",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("audio"),
    },
  ],
});

const videoMixerNode = createNodeDefinition({
  type: "video-mixer",
  displayName: "Video Mixer",
  description: "Merges multiple channels into synchronized composites",
  category: "Custom",
  defaultData: {
    title: "Video Mixer",
  },
  defaultSize: { width: 280, height: 180 },
  ports: [
    {
      id: "input-video-primary",
      type: "input",
      label: "Primary Feed",
      position: "left",
      dataType: "image",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("image"),
    },
    {
      id: "input-video-secondary",
      type: "input",
      label: "Overlay Feed",
      position: "left",
      dataType: "image",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("image"),
    },
    {
      id: "input-audio-bed",
      type: "input",
      label: "Audio Bed",
      position: "bottom",
      dataType: "audio",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("audio"),
    },
    {
      id: "input-telemetry",
      type: "input",
      label: "Telemetry",
      position: "top",
      dataType: "data",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("data"),
    },
    {
      id: "output-video",
      type: "output",
      label: "Composite Stream",
      position: "right",
      dataType: "video",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("video"),
    },
    {
      id: "monitor-metadata",
      type: "output",
      label: "Monitoring",
      position: "right",
      dataType: "data",
      renderPort: customPortRenderer,
      renderConnection: getConnectionRenderer("data"),
    },
  ],
});

// Example editor data with pre-wired connections
const initialData: NodeEditorData = {
  nodes: {
    "node-data-source": {
      id: "node-data-source",
      type: "data-source",
      position: { x: 60, y: 140 },
      data: { title: "Capture Source" },
    },
    "node-image": {
      id: "node-image",
      type: "image-processor",
      position: { x: 380, y: 60 },
      data: { title: "Vision Enhancer" },
    },
    "node-audio": {
      id: "node-audio",
      type: "audio-processor",
      position: { x: 380, y: 260 },
      data: { title: "Spatial Audio" },
    },
    "node-video": {
      id: "node-video",
      type: "video-mixer",
      position: { x: 720, y: 150 },
      data: { title: "Live Mixer" },
    },
  },
  connections: {
    "connection-frame-feed": {
      id: "connection-frame-feed",
      fromNodeId: "node-data-source",
      fromPortId: "output-frame",
      toNodeId: "node-image",
      toPortId: "input-image",
    },
    "connection-calibration": {
      id: "connection-calibration",
      fromNodeId: "node-data-source",
      fromPortId: "output-telemetry",
      toNodeId: "node-image",
      toPortId: "input-settings",
    },
    "connection-vision-to-mixer": {
      id: "connection-vision-to-mixer",
      fromNodeId: "node-image",
      fromPortId: "output-image",
      toNodeId: "node-video",
      toPortId: "input-video-primary",
    },
    "connection-telemetry": {
      id: "connection-telemetry",
      fromNodeId: "node-image",
      fromPortId: "output-data",
      toNodeId: "node-video",
      toPortId: "input-telemetry",
    },
    "connection-audio-bed": {
      id: "connection-audio-bed",
      fromNodeId: "node-audio",
      fromPortId: "output-audio",
      toNodeId: "node-video",
      toPortId: "input-audio-bed",
    },
  },
};

export const CustomPortRendererExample: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData>(initialData);

  return (
    <div className={classes.wrapper}>
      <h2 className={classes.title}>Custom Port Renderer Example</h2>
      <p className={classes.description}>
        This example showcases the updated port layout pipeline, combining SVG layering and canvas-driven telemetry
        to render ports and connections with richer visual context.
      </p>
      <ul className={classes.list}>
        <li>Ports expose dynamic radial gauges that react to connection count, with clear IN / OUT orientation badges</li>
        <li>Canvas overlays draw live tick marks while SVG gradients highlight directional flow and data categories</li>
        <li>Connections render with multi-stop gradients, flowing energy bands, and data-specific overlays</li>
        <li>Custom renderers rely on provided layout context so visuals stay synchronized with live node movement</li>
      </ul>
      <NodeEditor
        data={data}
        onDataChange={setData}
        nodeDefinitions={[
          toUntypedDefinition(dataSourceNode),
          toUntypedDefinition(imageProcessorNode),
          toUntypedDefinition(audioProcessorNode),
          toUntypedDefinition(videoMixerNode),
        ]}
      />
    </div>
  );
};

export default CustomPortRendererExample;

/**
 * Debug notes:
 * - Reviewed src/components/connection/ConnectionView.tsx to understand how custom renderers receive real-time position updates and pointer handlers.
 * - Reviewed src/types/NodeDefinition.ts to validate the ConnectionRenderContext and PortRenderContext fields used during custom rendering.
 */
