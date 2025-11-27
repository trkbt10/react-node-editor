/**
 * @file Utilities for stabilizing controlled NodeEditorData to minimize unnecessary renders.
 */
import * as React from "react";
import type { NodeEditorData } from "../../../types/core";
import { areStringArraysEqual } from "../../../core/common/comparators";
import { areNodesStructurallyEqual } from "../../../core/node/comparators";
import { areConnectionsStructurallyEqual } from "../../../core/connection/comparators";

const mergeRecordWithPrevious = <T extends { id: string }>(
  next: Record<string, T>,
  prev: Record<string, T>,
  isEqual: (prevItem: T, nextItem: T) => boolean,
): { merged: Record<string, T>; changed: boolean } => {
  if (next === prev) {
    return { merged: prev, changed: false };
  }

  const mergedEntries = Object.entries(next).map(([key, nextValue]) => {
    if (Object.prototype.hasOwnProperty.call(prev, key) && isEqual(prev[key], nextValue)) {
      return [key, prev[key]] as [string, T];
    }
    return [key, nextValue] as [string, T];
  });

  const merged = Object.fromEntries(mergedEntries) as Record<string, T>;
  const nextKeys = Object.keys(next);
  const prevKeys = Object.keys(prev);
  const missingPrevKey = prevKeys.some((key) => !Object.prototype.hasOwnProperty.call(next, key));
  const valuesChanged = Object.keys(merged).some((key) => merged[key] !== prev[key]);
  const changed = missingPrevKey || valuesChanged || nextKeys.length !== prevKeys.length;
  return { merged, changed };
};

export const areNodeEditorDataEqual = (prev: NodeEditorData, next: NodeEditorData): boolean => {
  const prevNodeIds = Object.keys(prev.nodes);
  const nextNodeIds = Object.keys(next.nodes);
  if (prevNodeIds.length !== nextNodeIds.length) {
    return false;
  }
  const prevConnIds = Object.keys(prev.connections);
  const nextConnIds = Object.keys(next.connections);
  if (prevConnIds.length !== nextConnIds.length) {
    return false;
  }
  if (!areStringArraysEqual(prev.lastDuplicatedNodeIds, next.lastDuplicatedNodeIds)) {
    return false;
  }
  for (const nodeId of prevNodeIds) {
    const prevNode = prev.nodes[nodeId];
    const nextNode = next.nodes[nodeId];
    if (!nextNode || !areNodesStructurallyEqual(prevNode, nextNode)) {
      return false;
    }
  }
  for (const connId of prevConnIds) {
    const prevConn = prev.connections[connId];
    const nextConn = next.connections[connId];
    if (!nextConn || !areConnectionsStructurallyEqual(prevConn, nextConn)) {
      return false;
    }
  }
  return true;
};

export const useStabilizedControlledData = (controlledData?: NodeEditorData) => {
  const previousRef = React.useRef<NodeEditorData | null>(null);

  return React.useMemo(() => {
    if (!controlledData) {
      previousRef.current = null;
      return undefined;
    }

    const previous = previousRef.current;
    if (!previous) {
      previousRef.current = controlledData;
      return controlledData;
    }

    const mergedNodes = mergeRecordWithPrevious(controlledData.nodes, previous.nodes, areNodesStructurallyEqual);
    const mergedConnections = mergeRecordWithPrevious(
      controlledData.connections,
      previous.connections,
      areConnectionsStructurallyEqual,
    );
    const lastDuplicatedNodeIds = controlledData.lastDuplicatedNodeIds;
    const lastDuplicatedChanged = !areStringArraysEqual(lastDuplicatedNodeIds, previous.lastDuplicatedNodeIds);

    if (!mergedNodes.changed && !mergedConnections.changed && !lastDuplicatedChanged) {
      return previous;
    }

    const nextState: NodeEditorData = {
      nodes: mergedNodes.changed ? mergedNodes.merged : previous.nodes,
      connections: mergedConnections.changed ? mergedConnections.merged : previous.connections,
      ...(lastDuplicatedChanged || typeof previous.lastDuplicatedNodeIds !== "undefined"
        ? { lastDuplicatedNodeIds: lastDuplicatedNodeIds }
        : {}),
    };
    previousRef.current = nextState;
    return nextState;
  }, [controlledData]);
};

// Re-export for backwards compatibility
export { areNodesStructurallyEqual, areConnectionsStructurallyEqual };
