/**
 * @file Custom connection renderer that highlights invalid connections
 */
import * as React from "react";

import type { ConnectionRenderContext } from "../../../../../types/NodeDefinition";

import styles from "./ConnectionRulesExample.module.css";

type DefaultConnectionElementProps = {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/**
 * Connection renderer that marks connections as invalid (red dashed line)
 * Used for demonstration purposes in the abnormal section
 */
export function invalidConnectionRenderer(
  _context: ConnectionRenderContext,
  defaultRender: () => React.ReactElement,
): React.ReactElement {
  const defaultElement = defaultRender();

  if (!React.isValidElement(defaultElement)) {
    return defaultElement;
  }

  const element = defaultElement as React.ReactElement<DefaultConnectionElementProps>;
  const defaultProps = element.props ?? {};

  return React.cloneElement(element, {
    className: [defaultProps.className, styles.invalidConnection].filter(Boolean).join(" "),
  });
}
