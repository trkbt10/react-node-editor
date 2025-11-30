/**
 * @file Shared types for the advanced nested editor example
 */
export type SubEditorNodeData = {
  title: string;
  description?: string;
  nestedEditorRefId: string;
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
  return typeof record.nestedEditorRefId === "string" && record.nestedEditorRefId.length > 0;
}

/*
debug-notes:
- Defines explicit node data contract used across SubEditorNode and AdvancedNestedEditorExample to avoid untyped access.
*/
