/**
 * @file Simple connection renderer matching the design.
 */
import * as React from "react";
import type { ConnectionRenderContext } from "../../../../../types/NodeDefinition";
import { calculateConnectionPath } from "../../../core/connection/path";
import { getOppositePortPosition } from "../../../core/port/position";
import styles from "./OpalThemeExample.module.css";


export const opalConnectionRenderer = (
  context: ConnectionRenderContext,
  defaultRender: () => React.ReactElement,
): React.ReactElement => {
  const defaultElement = defaultRender();
  const hitElement = React.isValidElement(defaultElement) ? (
    <g style={{ opacity: 0 }}>{defaultElement}</g>
  ) : (
    defaultElement
  );

  const { fromPort, toPort, fromPosition, toPosition, isSelected, isHovered, handlers } = context;

  const pathData = React.useMemo(
    () =>
      calculateConnectionPath(
        fromPosition,
        toPosition,
        fromPort.position,
        toPort?.position ?? getOppositePortPosition(fromPort.position),
      ),
    [fromPosition.x, fromPosition.y, toPosition.x, toPosition.y, fromPort.position, toPort?.position],
  );

  const strokeColor = isSelected || isHovered ? "#4a5568" : "#a0aec0";
  const strokeWidth = isSelected || isHovered ? 2.5 : 2;

  return (
    <g className={styles.simpleConnectorGroup}>
      <path
        d={pathData}
        className={styles.simpleConnector}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        style={{
          transition: "stroke 0.2s ease, stroke-width 0.2s ease",
        }}
      />

      <path
        d={pathData}
        className={styles.simpleConnectorHitArea}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        strokeLinecap="round"
        onPointerDown={handlers.onPointerDown}
        onPointerEnter={handlers.onPointerEnter}
        onPointerLeave={handlers.onPointerLeave}
        onContextMenu={handlers.onContextMenu}
      />

      {hitElement}
    </g>
  );
};
