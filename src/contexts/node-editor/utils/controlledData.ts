/**
 * @file Utilities for stabilizing controlled NodeEditorData to minimize unnecessary renders.
 */
import * as React from "react";
import type { Connection, Node, NodeEditorData, Port } from "../../../types/core";

const arePositionsEqual = (prev: Node["position"], next: Node["position"]): boolean => {
  return prev.x === next.x && prev.y === next.y;
};

const areSizesEqual = (prev?: Node["size"], next?: Node["size"]): boolean => {
  if (!prev && !next) {
    return true;
  }
  if (!prev || !next) {
    return false;
  }
  return prev.width === next.width && prev.height === next.height;
};

const areStringArraysEqual = (prev?: string[], next?: string[]): boolean => {
  if (!prev && !next) {
    return true;
  }
  if (!prev || !next) {
    return false;
  }
  if (prev.length !== next.length) {
    return false;
  }
  return prev.every((value, index) => value === next[index]);
};

const isPlainValueEqual = (prevValue: unknown, nextValue: unknown): boolean => {
  if (prevValue === nextValue) {
    return true;
  }
  const prevType = typeof prevValue;
  const nextType = typeof nextValue;
  if (prevType !== nextType) {
    return false;
  }
  if (prevValue === null || nextValue === null) {
    return false;
  }
  if (prevType === "object" || prevType === "function") {
    return false;
  }
  return Object.is(prevValue, nextValue);
};

const areRecordValuesShallowEqual = (prev: Record<string, unknown>, next: Record<string, unknown>): boolean => {
  if (prev === next) {
    return true;
  }
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  return prevKeys.every((key) => {
    if (!Object.prototype.hasOwnProperty.call(next, key)) {
      return false;
    }
    return isPlainValueEqual(prev[key], next[key]);
  });
};

const arePortsEqual = (prev?: Port[], next?: Port[]): boolean => {
  if (!prev && !next) {
    return true;
  }
  if (!prev || !next) {
    return false;
  }
  if (prev.length !== next.length) {
    return false;
  }
  return prev.every((port, index) => {
    const other = next[index];
    return (
      port.id === other.id &&
      port.type === other.type &&
      port.label === other.label &&
      port.nodeId === other.nodeId &&
      port.position === other.position &&
      port.dataType === other.dataType &&
      port.maxConnections === other.maxConnections &&
      areStringArraysEqual(port.allowedNodeTypes, other.allowedNodeTypes) &&
      areStringArraysEqual(port.allowedPortTypes, other.allowedPortTypes)
    );
  });
};

export const areNodesStructurallyEqual = (prev: Node, next: Node): boolean => {
  if (prev === next) {
    return true;
  }
  return (
    prev.id === next.id &&
    prev.type === next.type &&
    prev.order === next.order &&
    arePositionsEqual(prev.position, next.position) &&
    areSizesEqual(prev.size, next.size) &&
    areSizesEqual(prev.minSize, next.minSize) &&
    areSizesEqual(prev.maxSize, next.maxSize) &&
    prev.parentId === next.parentId &&
    areStringArraysEqual(prev.children, next.children) &&
    prev.expanded === next.expanded &&
    prev.visible === next.visible &&
    prev.locked === next.locked &&
    prev.resizable === next.resizable &&
    areRecordValuesShallowEqual(prev.data, next.data) &&
    arePortsEqual(prev._ports, next._ports)
  );
};

export const areConnectionsStructurallyEqual = (prev: Connection, next: Connection): boolean => {
  if (prev === next) {
    return true;
  }
  return (
    prev.id === next.id &&
    prev.fromNodeId === next.fromNodeId &&
    prev.fromPortId === next.fromPortId &&
    prev.toNodeId === next.toNodeId &&
    prev.toPortId === next.toPortId &&
    areRecordValuesShallowEqual(prev.data ?? {}, next.data ?? {})
  );
};

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
