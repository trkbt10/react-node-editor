import type { ComponentType } from "react";
import type { NodeViewProps } from "../components/node/NodeView";
import type { PortViewProps } from "../components/connection/ports/PortView";
import type { ConnectionViewProps } from "../components/connection/ConnectionView";

/**
 * Renderer components that can be customized in the node editor.
 */
export type NodeEditorRenderers = {
  /** Component used to render nodes within the canvas */
  node: ComponentType<NodeViewProps>;
  /** Component used to render ports on nodes */
  port: ComponentType<PortViewProps>;
  /** Component used to render connections between ports */
  connection: ComponentType<ConnectionViewProps>;
};

/**
 * Partial override of renderer components passed via props.
 */
export type NodeEditorRendererOverrides = Partial<NodeEditorRenderers>;
