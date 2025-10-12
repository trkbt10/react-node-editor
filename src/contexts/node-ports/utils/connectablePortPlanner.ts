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
  PortId,
  PortType,
} from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { getConnectablePortIds } from "./portConnectability";
import {
  ConnectionSwitchBehavior,
  getConnectionSwitchContext,
  createConnectionSnapshotWithout,
} from "./connectionSwitchBehavior";

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

export type ConnectablePortSourceInfo = {
  nodeId: NodeId;
  portId: PortId;
  portType: PortType;
  portIndex: number;
};

export type ConnectablePortDescriptor = {
  key: string;
  nodeId: NodeId;
  portId: PortId;
  portType: PortType;
  portIndex: number;
  source: ConnectablePortSourceInfo;
  behavior: ConnectionSwitchBehavior;
};

export type ConnectablePortsResult = {
  ids: Set<string>;
  descriptors: Map<string, ConnectablePortDescriptor>;
  source: ConnectablePortSourceInfo | null;
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

const createEmptyResult = (): ConnectablePortsResult => ({
  ids: new Set<string>(),
  descriptors: new Map<string, ConnectablePortDescriptor>(),
  source: null,
});

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
    return createEmptyResult();
  }

  const sourcePorts = getNodePorts(sourcePort.nodeId);
  const sourceIndex = findPortIndex(sourcePort, sourcePorts);
  const result: ConnectablePortsResult = createEmptyResult();
  const sourceInfo: ConnectablePortSourceInfo = {
    nodeId: sourcePort.nodeId,
    portId: sourcePort.id,
    portType: sourcePort.type,
    portIndex: sourceIndex,
  };

  const behaviorContext = getConnectionSwitchContext(sourcePort, nodes, connections, getNodeDefinition);

  const evaluationConnections =
    behaviorContext.behavior === ConnectionSwitchBehavior.Replace
      ? createConnectionSnapshotWithout(connections, behaviorContext.existingConnections)
      : connections;

  const candidateIds = getConnectablePortIds(sourcePort, nodes, getNodePorts, evaluationConnections, getNodeDefinition);

  candidateIds.forEach((key) => {
    const [nodeId, portId] = key.split(":");
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
