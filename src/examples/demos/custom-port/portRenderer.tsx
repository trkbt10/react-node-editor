/**
 * @file Advanced custom port renderer for the custom port example.
 */
import * as React from "react";
import type { PortRenderContext } from "../../../types/NodeDefinition";
import type { Port } from "../../../types/core";
import { countConnectionsForPort, getStyleForDataType } from "./dataStyles";
import styles from "./CustomPortRendererExample.module.css";

type DefaultPortElementProps = {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  title?: string;
  onPointerDown?: (event: React.PointerEvent) => void;
  onPointerUp?: (event: React.PointerEvent) => void;
  onPointerEnter?: (event: React.PointerEvent) => void;
  onPointerLeave?: (event: React.PointerEvent) => void;
};

const clamp = (value: number): number => {
  return Math.max(0, Math.min(1, value));
};

const getBadgeOffsetTransform = (position: Port["position"]): string => {
  switch (position) {
    case "left":
      return "translate(-50%, -50%) translateX(-16%)";
    case "right":
      return "translate(-50%, -50%) translateX(16%)";
    case "top":
      return "translate(-50%, -50%) translateY(-10%)";
    case "bottom":
      return "translate(-50%, -50%) translateY(10%)";
    default:
      return "translate(-50%, -50%)";
  }
};

const getDirectionPath = (type: Port["type"]): string => {
  if (type === "input") {
    return "M 12 26 L 24 14 L 24 20 L 40 20 L 40 32 L 24 32 L 24 38 Z";
  }
  return "M 40 26 L 28 14 L 28 20 L 12 20 L 12 32 L 28 32 L 28 38 Z";
};

const getDirectionGradientStops = (type: Port["type"]): { start: string; end: string } => {
  if (type === "input") {
    return { start: "rgba(59, 130, 246, 0.7)", end: "rgba(59, 130, 246, 0.05)" };
  }
  return { start: "rgba(249, 115, 22, 0.7)", end: "rgba(249, 115, 22, 0.05)" };
};

export const customPortRenderer = (
  context: PortRenderContext,
  defaultRender: () => React.ReactElement,
): React.ReactElement => {
  const defaultElement = defaultRender();
  if (!React.isValidElement(defaultElement) || !context.position) {
    return defaultElement;
  }

  const { port, handlers, allConnections, isHovered, isConnected, isCandidate, isConnectable, isConnecting } = context;

  const dataStyle = getStyleForDataType(port.dataType);
  const connectionCount = React.useMemo(() => {
    return countConnectionsForPort(allConnections, port.id);
  }, [allConnections, port.id]);

  const maxConnections =
    port.maxConnections === "unlimited" ? Math.max(connectionCount, 1) : (port.maxConnections ?? 1);
  const utilization = connectionCount === 0 ? 0 : clamp(connectionCount / maxConnections);

  const interactiveState = React.useMemo(() => {
    if (isCandidate) {
      return "candidate";
    }
    if (isConnectable) {
      return "connectable";
    }
    if (isHovered) {
      return "hovered";
    }
    if (isConnected) {
      return "connected";
    }
    return "idle";
  }, [isCandidate, isConnectable, isHovered, isConnected]);

  const portSize = React.useMemo(() => {
    const base = 28;
    if (isCandidate) {
      return base + 6;
    }
    if (isHovered) {
      return base + 4;
    }
    if (isConnectable) {
      return base + 2;
    }
    if (isConnected) {
      return base + 1;
    }
    return base;
  }, [isCandidate, isConnectable, isConnected, isHovered]);

  const badgeScale = React.useMemo(() => {
    if (isCandidate) {
      return 1.12;
    }
    if (isConnectable) {
      return 1.08;
    }
    if (isHovered) {
      return 1.04;
    }
    if (isConnected) {
      return 1.02;
    }
    return 1;
  }, [isCandidate, isConnectable, isConnected, isHovered]);

  const glyphGradientId = React.useId();
  const haloGradientId = React.useId();
  const directionGradientId = React.useId();
  const directionGradientStops = React.useMemo(() => getDirectionGradientStops(port.type), [port.type]);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return;
    }
    const pixelRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const renderSize = Math.max(1, Math.round(portSize * pixelRatio));
    if (canvasElement.width !== renderSize || canvasElement.height !== renderSize) {
      canvasElement.width = renderSize;
      canvasElement.height = renderSize;
    }
    canvasElement.style.width = `${portSize}px`;
    canvasElement.style.height = `${portSize}px`;

    const context2d = canvasElement.getContext("2d");
    if (!context2d) {
      return;
    }

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
  }, [
    connectionCount,
    dataStyle.accent,
    dataStyle.primary,
    dataStyle.secondary,
    isCandidate,
    isHovered,
    portSize,
    utilization,
  ]);

  const element = defaultElement as React.ReactElement<DefaultPortElementProps>;
  const defaultProps = element.props ?? {};

  const dataAttributes = {
    "data-port-connectable": String(isConnectable),
    "data-port-candidate": String(isCandidate),
    "data-port-hovered": String(isHovered),
    "data-port-connected": String(isConnected),
    "data-port-connecting": String(isConnecting),
  } satisfies Record<string, string>;

  return React.cloneElement(
    element,
    {
      className: [defaultProps.className, styles.portAnchor].filter(Boolean).join(" "),
      title: port.label,
      onPointerDown: handlers.onPointerDown,
      onPointerUp: handlers.onPointerUp,
      onPointerEnter: handlers.onPointerEnter,
      onPointerLeave: handlers.onPointerLeave,
      style: {
        ...(defaultProps.style ?? {}),
        background: "transparent",
        border: "none",
      },
      ...dataAttributes,
    },
    <>
      <div
        className={styles.portBadgeWrapper}
        data-port-state={interactiveState}
        data-port-type={port.type}
        style={{
          width: portSize,
          height: portSize,
          transform: `${getBadgeOffsetTransform(port.position)} scale(${badgeScale})`,
        }}
      >
        <svg className={styles.portBadgeSvg} viewBox="0 0 52 52" role="presentation" aria-hidden="true">
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
            <linearGradient
              id={directionGradientId}
              x1={port.type === "input" ? "0%" : "100%"}
              y1="50%"
              x2={port.type === "input" ? "100%" : "0%"}
              y2="50%"
            >
              <stop offset="0%" stopColor={directionGradientStops.start} />
              <stop offset="100%" stopColor={directionGradientStops.end} />
            </linearGradient>
          </defs>
          <circle className={styles.portBadgeHalo} cx="26" cy="26" r="24" fill={`url(#${haloGradientId})`} />
          <path
            className={styles.portDirectionPath}
            d={getDirectionPath(port.type)}
            fill={`url(#${directionGradientId})`}
          />
          <circle className={styles.portBadgeCore} cx="26" cy="26" r="16" fill={`url(#${glyphGradientId})`} />
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
            className={styles.portBadgeIcon}
            d={dataStyle.iconPath}
            stroke={dataStyle.secondary}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <text
            className={styles.portTypeGlyph}
            x="26"
            y="30"
            textAnchor="middle"
            fontSize="10"
            fontWeight={700}
            letterSpacing="0.08em"
          >
            {port.type === "input" ? "IN" : "OUT"}
          </text>
        </svg>
        <canvas ref={canvasRef} className={styles.portBadgeCanvas} />
      </div>
      {port.label ? (
        <span className={styles.portLabel} data-port-label-position={port.position} data-port-type={port.type}>
          {port.label}
        </span>
      ) : null}
    </>,
  );
};
