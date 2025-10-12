import type { NodeDefinition } from "./NodeDefinition";
import type { Node } from "./core";

// Behavior options for group behavior
export type GroupBehaviorOptions = {
  type: "group";
  /** Automatically add/remove nodes from group based on their position */
  autoGroup?: boolean;
};
export type AppearanceBehaviorOptions = {
  type: "appearance";
};
export type NodeBehaviorOptions = {
  type: "node";
};
type KeyOf<T> = T extends { type: infer U } ? U : never;
// Built-in node behaviors
export type ObjectBehaviorOptions = GroupBehaviorOptions | AppearanceBehaviorOptions | NodeBehaviorOptions;
export type NodeBehaviorType = KeyOf<ObjectBehaviorOptions>;

// Behavior can be either a simple string or an object with options
export type NodeBehavior = NodeBehaviorType | ObjectBehaviorOptions;

// Helper to get the behavior type from a behavior entry

/**
 * Extracts the behavior type from a behavior entry
 * @param behavior - Behavior entry (string or object)
 * @returns The behavior type string
 */
export function getBehaviorType(behavior: NodeBehavior): NodeBehaviorType {
  return typeof behavior === "string" ? behavior : behavior.type;
}

/**
 * Resolve behaviors for a node definition.
 * Returns the behaviors array or defaults to ["node"] if not specified.
 */
export function getBehaviors(def?: NodeDefinition | null): NodeBehavior[] {
  if (!def) {
    return ["node"];
  }

  const behaviors = def.behaviors;
  if (Array.isArray(behaviors) && behaviors.length > 0) {
    return behaviors;
  }
  return ["node"];
}

function hasBehaviorType(behaviors: NodeBehavior[] | undefined, type: NodeBehaviorType): boolean {
  if (!behaviors) {
    return false;
  }
  if (!Array.isArray(behaviors)) {
    return false;
  }

  return behaviors.some((b) => getBehaviorType(b) === type);
}
/**
 * Check if a node definition has the "group" behavior
 */
export function hasGroupBehavior(def?: NodeDefinition | null): boolean {
  return hasBehaviorType(getBehaviors(def), "group");
}

/**
 * Check if a node definition has the "appearance" behavior
 */
export function hasAppearanceBehavior(def?: NodeDefinition | null): boolean {
  return hasBehaviorType(getBehaviors(def), "appearance");
}

function pickBehavior<T extends NodeBehaviorType>(
  behaviors: NodeBehavior[] | undefined,
  type: T,
): Extract<NodeBehavior, { type: T }> | null {
  if (!behaviors) {
    return null;
  }
  if (!Array.isArray(behaviors)) {
    return null;
  }

  const found = behaviors.find((b) => getBehaviorType(b) === type);
  if (!found) {
    return null;
  }
  if (typeof found === "string") {
    // Return default options for the behavior type
    switch (type) {
      case "group":
        return { type: "group", autoGroup: false } as Extract<NodeBehavior, { type: T }>;
      case "appearance":
        return { type: "appearance" } as Extract<NodeBehavior, { type: T }>;
      case "node":
        return { type: "node" } as Extract<NodeBehavior, { type: T }>;
      default:
        return null;
    }
  }
  return found as Extract<NodeBehavior, { type: T }>;
}
/**
 * Get group behavior options from a node definition
 */
export function getGroupBehaviorOptions(def?: NodeDefinition | null): GroupBehaviorOptions | null {
  if (!def) {
    return null;
  }
  const behaviors = getBehaviors(def);
  const groupBehavior = pickBehavior(behaviors, "group");
  if (!groupBehavior) {
    return null;
  }

  // If it's a string, return default options
  if (typeof groupBehavior === "string") {
    return { type: "group", autoGroup: false };
  }

  return groupBehavior;
}

/**
 * Check if a behavior array includes a specific behavior type
 */
export function behaviorArrayIncludes(behaviors: NodeBehavior[], type: NodeBehaviorType): boolean {
  return behaviors.some((b) => getBehaviorType(b) === type);
}

/**
 * Check if a node has group behavior based on its definition
 */
export function nodeHasGroupBehavior(node: Node, nodeDefinitions: NodeDefinition[]): boolean {
  const def = nodeDefinitions.find((d) => d.type === node.type);
  return hasGroupBehavior(def);
}
