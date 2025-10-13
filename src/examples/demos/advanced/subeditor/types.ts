/**
 * @file Shared types for the advanced nested editor example
 */
import type { NodeEditorData } from "../../../../types/core";

export type SubEditorNodeData = {
  title: string;
  description?: string;
  nestedEditorData: NodeEditorData;
  lastUpdated?: string;
};

/**
 * Runtime type guard that checks if a value conforms to SubEditorNodeData.
 *
 * @param value - Value to inspect.
 * @returns True when the value looks like SubEditorNodeData.
 */
export function isSubEditorNodeData(value: unknown): value is SubEditorNodeData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return record.nestedEditorData !== undefined;
}

/*
debug-notes:
- Defines explicit node data contract used across SubEditorNode and AdvancedNestedEditorExample to avoid untyped access.
*/
