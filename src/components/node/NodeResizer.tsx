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
 * Props for the NodeResizer component
 */
export type NodeResizerProps = {
  /**
   * Node object (optional - if not provided, will attempt to resolve from context)
   * Takes precedence over size prop
   */
  node: Node;
  /**
   * Node size (width and height may be undefined)
   * Only used if node prop is not provided and no node is available in context
   */
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
  /** Indicates whether the node is currently being resized */
  isResizing?: boolean;
  /**
   * Callback fired when the node is being resized
   * @param size - The current size during resize
   * @param isResizing - Whether the resize is in progress
   */
  onResize?: (size: Required<Size>, isResizing: boolean) => void;
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
 * The node can be provided in three ways (priority order):
 * 1. Via `node` prop (highest priority)
 * 2. Via context from a parent NodeResizer
 * 3. Via `size` prop (fallback for backward compatibility)
 *
 * @example Method 1: Explicit node prop (recommended when node is available)
 * ```tsx
 * const MyNodeRenderer = ({ node }: NodeRenderProps) => (
 *   <NodeResizer node={node}>
 *     {({width, height}) => (
 *       <div style={{width, height}}>
 *         {node.data.title}
 *       </div>
 *     )}
 *   </NodeResizer>
 * );
 * ```
 *
 * @example Method 2: Implicit resolution from context (cleanest API)
 * ```tsx
 * const MyNodeRenderer = ({ node }: NodeRenderProps) => (
 *   <NodeResizer node={node}>
 *     {() => <MyNodeContent />}
 *   </NodeResizer>
 * );
 *
 * const MyNodeContent = () => {
 *   // NodeResizer inside can access node from parent context automatically
 *   return (
 *     <NodeResizer>
 *       {({width, height}) => (
 *         <div style={{width, height}}>Content</div>
 *       )}
 *     </NodeResizer>
 *   );
 * };
 * ```
 *
 * @example Method 3: Using size prop (backward compatible)
 * ```tsx
 * <NodeResizer size={node.size}>
 *   {({width, height}) => (
 *     <div style={{width, height}}>Content</div>
 *   )}
 * </NodeResizer>
 * ```
 *
 * @example Using context hook for deep nesting
 * ```tsx
 * const DeepNestedComponent = () => {
 *   const node = useNodeResizerContext();
 *   return <div>{node?.data.title}</div>;
 * };
 * ```
 *
 * @example Listening to resize events
 * ```tsx
 * const MyNodeRenderer = ({ node, isResizing }: NodeRenderProps) => {
 *   const handleResize = (size: Required<Size>, resizing: boolean) => {
 *     console.log('Current size:', size, 'Is resizing:', resizing);
 *   };
 *
 *   return (
 *     <NodeResizer node={node} isResizing={isResizing} onResize={handleResize}>
 *       {({width, height}) => (
 *         <div style={{width, height}}>Content</div>
 *       )}
 *     </NodeResizer>
 *   );
 * };
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
  isResizing = false,
  onResize,
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

  // Notify parent of resize changes
  const onResizeCallback = React.useEffectEvent((currentSize: Required<Size>, resizing: boolean) => {
    if (onResize) {
      onResize(currentSize, resizing);
    }
  });

  React.useEffect(() => {
    onResizeCallback(normalizedSize, isResizing);
  }, [normalizedSize.width, normalizedSize.height, isResizing]);

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
