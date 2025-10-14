/**
 * @file Node resizer component for custom node renderers
 * This component standardizes size handling for custom node implementations.
 */
import * as React from "react";
import type { Size } from "../../types/core";

/**
 * Default size constants
 */
const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 50;

/**
 * Props for the NodeResizer component
 */
export type NodeResizerProps = {
  /** Node size (width and height may be undefined) */
  size?: Size;
  /** Child render function that receives normalized size */
  children: (size: Required<Size>) => React.ReactNode;
  /** Optional default width (defaults to 150) */
  defaultWidth?: number;
  /** Optional default height (defaults to 50) */
  defaultHeight?: number;
  /** Optional className for the wrapper */
  className?: string;
  /** Optional style overrides */
  style?: React.CSSProperties;
};

/**
 * Normalizes node size with defaults
 * @param size - Optional size from node
 * @param defaultWidth - Default width to use if not provided
 * @param defaultHeight - Default height to use if not provided
 * @returns Normalized size with width and height guaranteed
 */
export const normalizeNodeSize = (
  size: Size | undefined,
  defaultWidth: number,
  defaultHeight: number,
): Required<Size> => {
  return {
    width: size?.width ?? defaultWidth,
    height: size?.height ?? defaultHeight,
  };
};

/**
 * NodeResizer component
 *
 * This component standardizes size handling for custom node renderers.
 * Instead of writing `style={{width: node.size?.width, height: node.size?.height}}`
 * in every custom renderer, you can use this wrapper:
 *
 * @example
 * ```tsx
 * <NodeResizer size={node.size}>
 *   {({width, height}) => (
 *     <div style={{width, height}}>
 *       {/* Your custom node content *\/}
 *     </div>
 *   )}
 * </NodeResizer>
 * ```
 */
export const NodeResizer: React.FC<NodeResizerProps> = ({
  size,
  children,
  defaultWidth = DEFAULT_NODE_WIDTH,
  defaultHeight = DEFAULT_NODE_HEIGHT,
  className,
  style,
}) => {
  const normalizedSize = React.useMemo(
    () => normalizeNodeSize(size, defaultWidth, defaultHeight),
    [size, defaultWidth, defaultHeight],
  );

  const mergedStyle = React.useMemo(
    () => ({
      width: normalizedSize.width,
      height: normalizedSize.height,
      ...style,
    }),
    [normalizedSize.width, normalizedSize.height, style],
  );

  return (
    <div className={className} style={mergedStyle}>
      {children(normalizedSize)}
    </div>
  );
};

NodeResizer.displayName = "NodeResizer";
