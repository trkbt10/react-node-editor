/**
 * @file ConnectionPath component
 * Shared path rendering for both DragConnection and ConnectionView.
 * This ensures both use exactly the same path calculation and rendering logic.
 */
import * as React from "react";
import type { Position } from "../../types/core";
import { calculateConnectionPath } from "../../core/connection/path";

export type ConnectionPathProps = {
  /** Output port position */
  outputPosition: Position;
  /** Input port position */
  inputPosition: Position;
  /** Additional className for the path */
  className?: string;
  /** Inline style for the path */
  style?: React.CSSProperties;
  /** Data attributes to apply to the path */
  dataAttributes?: Record<string, string | boolean | undefined>;
};

/**
 * Renders a connection path using the provided positions.
 * Direction is automatically calculated from the geometric relationship.
 */
export const ConnectionPath: React.FC<ConnectionPathProps> = ({
  outputPosition,
  inputPosition,
  className,
  style,
  dataAttributes,
}) => {
  const pathData = React.useMemo(
    () => calculateConnectionPath(outputPosition, inputPosition),
    [outputPosition.x, outputPosition.y, inputPosition.x, inputPosition.y],
  );

  const dataProps = React.useMemo(() => {
    if (!dataAttributes) {
      return {};
    }
    const result: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(dataAttributes)) {
      if (value !== undefined) {
        result[`data-${key}`] = String(value);
      }
    }
    return result;
  }, [dataAttributes]);

  return <path d={pathData} className={className} style={style} {...dataProps} />;
};

/**
 * Hook to compute path data string from positions.
 * Use this when you need the raw path data without rendering.
 */
export const useConnectionPathData = (outputPosition: Position, inputPosition: Position): string =>
  React.useMemo(
    () => calculateConnectionPath(outputPosition, inputPosition),
    [outputPosition.x, outputPosition.y, inputPosition.x, inputPosition.y],
  );
