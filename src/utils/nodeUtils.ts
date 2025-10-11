import type { ReactNode } from "react";
import type { NodeDefinition } from "../types/NodeDefinition";

/**
 * Get the icon for a node type from node definitions
 * Falls back to default icons if no custom icon is defined
 */
export const getNodeIcon = (
  nodeType: string,
  nodeDefinitions: NodeDefinition[]
): ReactNode => {
  const definition = nodeDefinitions.find(def => def.type === nodeType);
  
  if (definition?.icon) {
    return definition.icon;
  }
  
  return getDefaultIcon(nodeType);
};

/**
 * Get default icon for common node types
 * Used as fallback when no custom icon is defined in NodeDefinition
 */
const getDefaultIcon = (nodeType: string): string => {
  switch (nodeType) {
    case "group":
      return "📁";
    case "input":
      return "📥";
    case "output":
      return "📤";
    case "process":
      return "⚙️";
    case "code-editor":
      return "💻";
    case "chart":
      return "📊";
    case "form-builder":
      return "📝";
    case "task":
      return "✅";
    case "standard":
      return "🔗";
    default:
      return "📦";
  }
};


