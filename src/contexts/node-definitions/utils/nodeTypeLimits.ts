/**
 * @file Utilities for enforcing per-flow node type limits and capacity checking
 */
import type { NodeEditorData } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";

/** Build a count map of node types present in the editor state */
export function countNodesByType(state: NodeEditorData): Map<string, number> {
  const counts = new Map<string, number>();
  Object.values(state.nodes).forEach((n) => {
    counts.set(n.type, (counts.get(n.type) || 0) + 1);
  });
  return counts;
}

/** Get definition by type from an array */
export function getDefinition(defs: NodeDefinition[], type: string): NodeDefinition | undefined {
  return defs.find((d) => d.type === type);
}

/** Determine if a given type can be added respecting maxPerFlow constraint */
export function canAddNodeType(type: string, defs: NodeDefinition[], counts: Map<string, number>): boolean {
  const def = getDefinition(defs, type);
  if (!def) {
    return false;
  } // unknown type: disallow
  if (typeof def.maxPerFlow !== "number") {
    return true;
  } // no limit
  const current = counts.get(type) || 0;
  return current < def.maxPerFlow;
}

/** List of node types that have reached their per-flow limit */
export function getDisabledNodeTypes(defs: NodeDefinition[], counts: Map<string, number>): string[] {
  return defs
    .filter((d) => typeof d.maxPerFlow === "number" && (counts.get(d.type) || 0) >= (d.maxPerFlow as number))
    .map((d) => d.type);
}

/**
 * Filter a list of nodeIds to duplicate so that resulting duplicates do not exceed per-type limits.
 * Returns the subset of nodeIds that can be duplicated given current counts and definitions.
 */
export function filterDuplicableNodeIds(nodeIds: string[], state: NodeEditorData, defs: NodeDefinition[]): string[] {
  const counts = countNodesByType(state);
  const remainingByType = new Map<string, number>();

  // Precompute remaining capacity per type
  defs.forEach((d) => {
    if (typeof d.maxPerFlow === "number") {
      const current = counts.get(d.type) || 0;
      remainingByType.set(d.type, Math.max(0, d.maxPerFlow - current));
    }
  });

  const result: string[] = [];
  for (const nodeId of nodeIds) {
    const node = state.nodes[nodeId];
    if (!node) {
      continue;
    }
    const def = getDefinition(defs, node.type);
    if (!def) {
      continue;
    }
    if (typeof def.maxPerFlow !== "number") {
      result.push(nodeId);
      continue;
    }
    const remain = remainingByType.get(node.type) ?? Infinity;
    if (remain > 0) {
      result.push(nodeId);
      remainingByType.set(node.type, remain - 1);
    }
  }
  return result;
}
