/**
 * @file Custom port renderer for connection rules example
 * Shows what connection rules are configured for each port
 */
import * as React from "react";

import type { PortRenderContext } from "../../../../../types/NodeDefinition";

import styles from "./ConnectionRulesExample.module.css";

type RuleType = "dataType" | "canConnect" | "maxConnections";

type DefaultPortElementProps = {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onPointerDown?: (event: React.PointerEvent) => void;
  onPointerUp?: (event: React.PointerEvent) => void;
  onPointerEnter?: (event: React.PointerEvent) => void;
  onPointerLeave?: (event: React.PointerEvent) => void;
  "data-port-active"?: string;
};

const ruleColors: Record<RuleType, string> = {
  dataType: "#3b82f6",
  canConnect: "#f59e0b",
  maxConnections: "#ec4899",
};

/**
 * Get display text for maxConnections value
 */
function formatMaxConnections(value: number | "unlimited" | undefined): string {
  if (value === "unlimited") {
    return "∞";
  }
  if (value === undefined || value === 1) {
    return "1";
  }
  return String(value);
}

/**
 * Get display text for dataType value
 */
function formatDataType(value: string | string[] | undefined): string {
  if (!value) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.join("|");
  }
  return value;
}

/**
 * Creates a port renderer that shows specific rule badges
 */
export function createRulePortRenderer(rules: { type: RuleType; label?: string }[]) {
  return function rulePortRenderer(
    context: PortRenderContext,
    defaultRender: () => React.ReactElement,
  ): React.ReactElement {
    const defaultElement = defaultRender();
    if (!React.isValidElement(defaultElement)) {
      return defaultElement;
    }

    const { port, handlers, isHovered, isConnectable, isCandidate } = context;

    const element = defaultElement as React.ReactElement<DefaultPortElementProps>;
    const defaultProps = element.props ?? {};

    // Determine badge content based on rules and port properties
    const badges = rules.map((rule) => {
      let displayValue = rule.label ?? "";

      if (rule.type === "dataType" && !rule.label) {
        displayValue = formatDataType(port.dataType);
      }
      if (rule.type === "maxConnections" && !rule.label) {
        displayValue = formatMaxConnections(port.maxConnections);
      }

      return {
        type: rule.type,
        color: ruleColors[rule.type],
        value: displayValue,
      };
    });

    const isActive = isHovered || isConnectable || isCandidate;

    return React.cloneElement(
      element,
      {
        className: [defaultProps.className, styles.rulePort].filter(Boolean).join(" "),
        onPointerDown: handlers.onPointerDown,
        onPointerUp: handlers.onPointerUp,
        onPointerEnter: handlers.onPointerEnter,
        onPointerLeave: handlers.onPointerLeave,
        style: {
          ...(defaultProps.style ?? {}),
        },
        "data-port-active": String(isActive),
      },
      <>
        <div
          className={styles.rulePortDot}
          style={{
            backgroundColor: badges[0]?.color ?? "#666",
            transform: isCandidate ? "scale(1.4)" : isActive ? "scale(1.2)" : "scale(1)",
          }}
        />
        <div className={styles.ruleBadgeContainer} data-position={port.position}>
          {badges.map((badge, index) => (
            <span
              key={index}
              className={styles.ruleBadge}
              style={{
                backgroundColor: badge.color,
                opacity: isActive ? 1 : 0.85,
              }}
            >
              {badge.value}
            </span>
          ))}
        </div>
      </>,
    );
  };
}

/** Port renderer showing dataType rule */
export const dataTypePortRenderer = createRulePortRenderer([{ type: "dataType" }]);

/** Port renderer showing canConnect rule with custom label */
export function createCanConnectPortRenderer(label: string) {
  return createRulePortRenderer([{ type: "canConnect", label }]);
}

/** Port renderer showing maxConnections rule */
export const maxConnectionsPortRenderer = createRulePortRenderer([{ type: "maxConnections" }]);

/** Port renderer for validateConnection (node-level validation) */
export function createValidateConnectionPortRenderer(label: string) {
  return function validateConnectionPortRenderer(
    context: PortRenderContext,
    defaultRender: () => React.ReactElement,
  ): React.ReactElement {
    const defaultElement = defaultRender();
    if (!React.isValidElement(defaultElement)) {
      return defaultElement;
    }

    const { port, handlers, isHovered, isConnectable, isCandidate } = context;

    const element = defaultElement as React.ReactElement<DefaultPortElementProps>;
    const defaultProps = element.props ?? {};
    const isActive = isHovered || isConnectable || isCandidate;
    const color = "#8b5cf6"; // validateConnection color

    return React.cloneElement(
      element,
      {
        className: [defaultProps.className, styles.rulePort].filter(Boolean).join(" "),
        onPointerDown: handlers.onPointerDown,
        onPointerUp: handlers.onPointerUp,
        onPointerEnter: handlers.onPointerEnter,
        onPointerLeave: handlers.onPointerLeave,
        style: {
          ...(defaultProps.style ?? {}),
        },
        "data-port-active": String(isActive),
      },
      <>
        <div
          className={styles.rulePortDot}
          style={{
            backgroundColor: color,
            transform: isCandidate ? "scale(1.4)" : isActive ? "scale(1.2)" : "scale(1)",
          }}
        />
        <div className={styles.ruleBadgeContainer} data-position={port.position}>
          <span
            className={styles.ruleBadge}
            style={{
              backgroundColor: color,
              opacity: isActive ? 1 : 0.85,
            }}
          >
            {label}
          </span>
        </div>
      </>,
    );
  };
}
