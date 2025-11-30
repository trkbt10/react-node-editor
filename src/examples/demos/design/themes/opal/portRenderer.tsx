/**
 * @file Simple port renderer matching the design with black circle and center dot.
 */
import * as React from "react";
import type { PortRenderContext } from "../../../../../types/NodeDefinition";
import styles from "./OpalThemeExample.module.css";

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

export const opalPortRenderer = (
  context: PortRenderContext,
  defaultRender: () => React.ReactElement,
): React.ReactElement => {
  const defaultElement = defaultRender();
  if (!React.isValidElement(defaultElement) || !context.position) {
    return defaultElement;
  }

  const { port, handlers, isHovered, isCandidate } = context;

  const portSize = 12;
  const dotSize = 4;

  const element = defaultElement as React.ReactElement<DefaultPortElementProps>;
  const defaultProps = element.props ?? {};

  return React.cloneElement(
    element,
    {
      className: [defaultProps.className, styles.simplePortAnchor].filter(Boolean).join(" "),
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
    },
    <div
      className={styles.simplePortCircle}
      data-port-hovered={String(isHovered)}
      data-port-candidate={String(isCandidate)}
      style={{
        width: portSize,
        height: portSize,
        borderRadius: "50%",
        backgroundColor: isHovered || isCandidate ? "#4a5568" : "#2d3748",
        border: "1px solid #1a202c",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.2s ease",
      }}
    >
      <div
        className={styles.simplePortDot}
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          backgroundColor: "#ffffff",
        }}
      />
    </div>,
  );
};
