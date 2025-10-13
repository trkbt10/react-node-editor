/**
 * @file Shared in-memory store for sub-editor nested flow data
 */
import type { NodeEditorData } from "../../../../types/core";

const subEditorDataStore = new Map<string, NodeEditorData>();

/**
 * Retrieves the sub-editor data for the given reference identifier.
 *
 * @param refId - External data reference identifier.
 * @returns Stored NodeEditorData or undefined when missing.
 */
export function getSubEditorData(refId: string): NodeEditorData | undefined {
  return subEditorDataStore.get(refId);
}

/**
 * Ensures that sub-editor data exists for the reference identifier.
 * When data is missing, the initializer is executed and persisted.
 *
 * @param refId - External data reference identifier.
 * @param initializer - Factory invoked when no data is present.
 * @returns Existing or newly created NodeEditorData.
 */
export function ensureSubEditorData(refId: string, initializer: () => NodeEditorData): NodeEditorData {
  const existing = subEditorDataStore.get(refId);
  if (existing) {
    return existing;
  }
  const created = initializer();
  subEditorDataStore.set(refId, created);
  return created;
}

/**
 * Stores updated sub-editor data for the given reference identifier.
 *
 * @param refId - External data reference identifier.
 * @param data - NodeEditorData to persist.
 */
export function setSubEditorData(refId: string, data: NodeEditorData): void {
  subEditorDataStore.set(refId, data);
}

/**
 * Deletes the stored sub-editor data entry for the reference identifier.
 *
 * @param refId - External data reference identifier.
 */
export function deleteSubEditorData(refId: string): void {
  subEditorDataStore.delete(refId);
}

/**
 * Generates a consistent external reference identifier for a node.
 *
 * @param nodeId - Node identifier used as namespace.
 * @returns External data reference identifier.
 */
export function createSubEditorRefId(nodeId: string): string {
  return `sub-editor:${nodeId}`;
}

/*
debug-notes:
- Created dedicated store helpers so nested flow data can be shared via externalDataRefs without duplicating state.
*/
