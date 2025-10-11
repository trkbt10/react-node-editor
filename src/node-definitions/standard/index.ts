import type { NodeDefinition } from "../../types/NodeDefinition";
import { StandardNodeRenderer } from "./node";

/**
 * Standard node definition
 * A basic node with title and content
 */
export const StandardNodeDefinition: NodeDefinition<"standard"> = {
  type: "standard",
  displayName: "Standard Node",
  description: "A basic node with customizable properties",
  category: "Basic",
  defaultData: {
    title: "New Node",
    content: "",
  },
  defaultSize: { width: 200, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Input",
      position: "left",
    },
    {
      id: "output",
      type: "output",
      label: "Output",
      position: "right",
    },
  ],
  behaviors: ["node"],
  renderNode: StandardNodeRenderer,
};
