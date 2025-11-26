/**
 * @file Node view component - entry point
 * Re-exports the container/presenter architecture for backward compatibility
 */
export { NodeViewContainer as NodeView } from "./NodeViewContainer";
export type { NodeViewContainerProps as NodeViewProps } from "./NodeViewContainer";
export type { CustomNodeRendererProps } from "./NodeViewPresenter";
