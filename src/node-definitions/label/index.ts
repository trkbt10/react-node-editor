/**
 * @file Label node definition - a text label with title, subtitle, and caption
 */
import type { NodeDefinition } from "../../types/NodeDefinition";
import type { LabelNodeData } from "./types";
import { LabelNodeRenderer } from "./node";
import { LabelInspectorRenderer } from "./inspector";

/**
 * Label node definition
 * A decoration-less text label with optional subtitle and caption
 */
export const LabelNodeDefinition: NodeDefinition<LabelNodeData> = {
  type: "label",
  displayName: "Label",
  description: "A decoration-less text label with optional subtitle and caption",
  icon: "📝",
  category: "Structure",
  defaultData: {
    title: "Label",
    labelTitle: "Title",
    labelSubtitle: "Subtitle",
    labelCaption: "Caption",
    align: "left",
    wrap: "normal",
  },
  // Provide a compact default size; content may exceed if long
  defaultSize: { width: 220, height: 72 },
  // Fix node size to ensure proper text alignment within the area
  defaultResizable: false,
  // No ports for a pure label
  ports: [],
  behaviors: ["appearance"],
  renderNode: LabelNodeRenderer,
  renderInspector: LabelInspectorRenderer,
};
