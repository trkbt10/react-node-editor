/**
 * @file Node resizer component for custom node renderers
 * This component standardizes size handling for custom node implementations.
 */
import * as React from "react";
import type { Size, Node } from "../../types/core";

/**
 * Default size constants
 */
const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 50;

/**
 * Context for NodeResizer to provide node data
 */
type NodeResizerContextValue = {
  node: Node;
} | null;

const NodeResizerContext = React.createContext<NodeResizerContextValue>(null);

/**
 * Hook to access the node from NodeResizerContext
 * @returns The node from context, or null if not in a NodeResizerContext
 */
export const useNodeResizerContext = (): Node | null => {
  const context = React.useContext(NodeResizerContext);
  return context?.node ?? null;
};

/**
 * Props for the NodeResizer component
 */
export type NodeResizerProps = {
  /** Node object (preferred - takes precedence over size) */
  node?: Node;
  /** Node size (width and height may be undefined) - deprecated in favor of node prop */
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
 * in every custom renderer, you can use this wrapper.
 *
 * @example Using with node prop (recommended)
 * ```tsx
 * <NodeResizer node={node}>
 *   {({width, height}) => (
 *     <div style={{width, height}}>
 *       {/* Your custom node content *\/}
 *     </div>
 *   )}
 * </NodeResizer>
 * ```
 *
 * @example Using with size prop (backward compatible)
 * ```tsx
 * <NodeResizer size={node.size}>
 *   {({width, height}) => (
 *     <div style={{width, height}}>
 *       {/* Your custom node content *\/}
 *     </div>
 *   )}
 * </NodeResizer>
 * ```
 *
 * @example Using context for nested components
 * ```tsx
 * <NodeResizer node={node}>
 *   {({width, height}) => (
 *     <CustomComponent />  // Can use useNodeResizerContext() inside
 *   )}
 * </NodeResizer>
 * ```
 */
export const NodeResizer: React.FC<NodeResizerProps> = ({
  node,
  size,
  children,
  defaultWidth = DEFAULT_NODE_WIDTH,
  defaultHeight = DEFAULT_NODE_HEIGHT,
  className,
  style,
}) => {
  // Determine the size to use: node.size takes precedence over size prop
  const effectiveSize = React.useMemo(() => {
    if (node) {
      return node.size;
    }
    return size;
  }, [node, size]);

  const normalizedSize = React.useMemo(
    () => normalizeNodeSize(effectiveSize, defaultWidth, defaultHeight),
    [effectiveSize, defaultWidth, defaultHeight],
  );

  const mergedStyle = React.useMemo(
    () => ({
      width: normalizedSize.width,
      height: normalizedSize.height,
      ...style,
    }),
    [normalizedSize.width, normalizedSize.height, style],
  );

  const contextValue = React.useMemo<NodeResizerContextValue>(
    () => (node ? { node } : null),
    [node],
  );

  const content = (
    <div className={className} style={mergedStyle}>
      {children(normalizedSize)}
    </div>
  );

  // Only provide context if node is available
  if (contextValue) {
    return <NodeResizerContext.Provider value={contextValue}>{content}</NodeResizerContext.Provider>;
  }

  return content;
};

NodeResizer.displayName = "NodeResizer";
