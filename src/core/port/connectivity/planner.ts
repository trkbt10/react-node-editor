/**
 * @file Utilities for computing which ports can accept connections during drag and disconnect operations
 */
import type {
  Connection,
  ConnectionDisconnectState,
  ConnectionDragState,
  Node,
  NodeId,
  Port,
} from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { getConnectablePortIds } from "./connectability";
import { getConnectionSwitchContext } from "./connectionPlanning";
import { parsePortKey } from "../identity/key";
import {
  createEmptyConnectablePorts,
  type ConnectablePortSourceInfo,
  type ConnectablePortsResult,
} from "./connectableTypes";

type ResolveSourcePortParams = {
  dragStatePort?: Port | null;
  disconnectFixedPort?: Port | null;
  fallbackPort?: Port | null;
};

export type ComputeConnectablePortsParams = {
  dragState?: ConnectionDragState | null;
  disconnectState?: ConnectionDisconnectState | null;
  fallbackPort?: Port | null;
  nodes: Record<NodeId, Node>;
  connections: Record<string, Connection>;
  getNodePorts: (nodeId: string) => Port[];
  getNodeDefinition: (type: string) => NodeDefinition | undefined;
};

const resolveSourcePort = ({
  dragStatePort,
  disconnectFixedPort,
  fallbackPort,
}: ResolveSourcePortParams): Port | null => {
  if (dragStatePort) {
    return dragStatePort;
  }
  if (disconnectFixedPort) {
    return disconnectFixedPort;
  }
  return fallbackPort ?? null;
};

const findPortIndex = (port: Port, ports: Port[]): number => ports.findIndex((candidate) => candidate.id === port.id);

/**
 * Determine the ports that can accept a connection for the current interaction context.
 * Returns both the raw identifiers and detailed descriptors to aid debugging and UI decisions.
 */
export const computeConnectablePortIds = ({
  dragState,
  disconnectState,
  fallbackPort,
  nodes,
  connections,
  getNodePorts,
  getNodeDefinition,
}: ComputeConnectablePortsParams): ConnectablePortsResult => {
  const sourcePort = resolveSourcePort({
    dragStatePort: dragState?.fromPort ?? null,
    disconnectFixedPort: disconnectState?.fixedPort ?? null,
    fallbackPort,
  });

  if (!sourcePort) {
    return createEmptyConnectablePorts();
  }

  const sourcePorts = getNodePorts(sourcePort.nodeId);
  const sourceIndex = findPortIndex(sourcePort, sourcePorts);
  const result: ConnectablePortsResult = createEmptyConnectablePorts();
  const sourceInfo: ConnectablePortSourceInfo = {
    nodeId: sourcePort.nodeId,
    portId: sourcePort.id,
    portType: sourcePort.type,
    portIndex: sourceIndex,
  };

  const behaviorContext = getConnectionSwitchContext(sourcePort, nodes, connections, getNodeDefinition);

  const candidateIds = getConnectablePortIds(sourcePort, nodes, getNodePorts, connections, getNodeDefinition);

  candidateIds.forEach((key) => {
    const parsed = parsePortKey(key);
    if (!parsed) {
      return;
    }
    const { nodeId, portId } = parsed;
    const ports = getNodePorts(nodeId);
    const portIndex = ports.findIndex((port) => port.id === portId);
    const port = ports[portIndex];
    if (!port) {
      return;
    }

    result.ids.add(key);
    result.descriptors.set(key, {
      key,
      nodeId,
      portId,
      portType: port.type,
      portIndex,
      source: sourceInfo,
      behavior: behaviorContext.behavior,
    });
  });

  result.source = sourceInfo;
  return result;
};

export const resolveConnectableSourcePort = ({
  dragState,
  disconnectState,
  fallbackPort,
}: Pick<ComputeConnectablePortsParams, "dragState" | "disconnectState" | "fallbackPort">): Port | null =>
  resolveSourcePort({
    dragStatePort: dragState?.fromPort ?? null,
    disconnectFixedPort: disconnectState?.fixedPort ?? null,
    fallbackPort,
  });
