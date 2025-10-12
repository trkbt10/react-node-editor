import type { Node, NodeId, Port, PortId, Position } from "../../../types/core";
import type { ConnectablePortsResult } from "./connectablePortPlanner";
import { PORT_INTERACTION_THRESHOLD } from "../../../constants/interaction";

export type ConnectionCandidateSearchParams = {
  pointerCanvasPosition: Position;
  connectablePorts: ConnectablePortsResult;
  nodes: Record<NodeId, Node>;
  getNodePorts: (nodeId: NodeId) => Port[];
  getConnectionPoint: (nodeId: NodeId, portId: PortId) => Position | null;
  excludePort?: { nodeId: NodeId; portId: PortId };
  snapDistance?: number;
};

type CandidateWithDistance = {
  port: Port;
  distance: number;
};

const clonePort = (port: Port): Port => ({
  id: port.id,
  nodeId: port.nodeId,
  type: port.type,
  label: port.label,
  position: port.position,
  dataType: port.dataType,
  maxConnections: port.maxConnections,
  allowedNodeTypes: port.allowedNodeTypes,
  allowedPortTypes: port.allowedPortTypes,
});

const toDescriptorTuples = (connectablePorts: ConnectablePortsResult): Array<{ nodeId: NodeId; portId: PortId }> => {
  if (connectablePorts.descriptors.size > 0) {
    return Array.from(connectablePorts.descriptors.values()).map((descriptor) => ({
      nodeId: descriptor.nodeId,
      portId: descriptor.portId,
    }));
  }

  return Array.from(connectablePorts.ids).map((key) => {
    const [nodeId, portId] = key.split(":");
    return { nodeId, portId };
  });
};

/**
 * Resolve the nearest connectable port to the provided pointer position.
 * Returns null when no candidate is within the snap distance or port data is unavailable.
 */
export function findNearestConnectablePort({
  pointerCanvasPosition,
  connectablePorts,
  nodes,
  getNodePorts,
  getConnectionPoint,
  excludePort,
  snapDistance = PORT_INTERACTION_THRESHOLD.CONNECTION_SNAP_DISTANCE,
}: ConnectionCandidateSearchParams): Port | null {
  if (connectablePorts.ids.size === 0) {
    return null;
  }

  const descriptorInputs = toDescriptorTuples(connectablePorts);
  const candidates = descriptorInputs
    .filter(({ nodeId, portId }) => {
      if (!nodeId || !portId) {
        return false;
      }
      if (!nodes[nodeId]) {
        return false;
      }
      if (excludePort && excludePort.nodeId === nodeId && excludePort.portId === portId) {
        return false;
      }
      return true;
    })
    .map(({ nodeId, portId }) => {
      const connectionPoint = getConnectionPoint(nodeId, portId);
      if (!connectionPoint) {
        return null;
      }

      const dx = connectionPoint.x - pointerCanvasPosition.x;
      const dy = connectionPoint.y - pointerCanvasPosition.y;
      const distance = Math.hypot(dx, dy);
      if (distance > snapDistance) {
        return null;
      }

      const port = getNodePorts(nodeId).find((candidate) => candidate.id === portId);
      if (!port) {
        return null;
      }

      return {
        port: clonePort(port),
        distance,
      };
    })
    .filter((entry): entry is CandidateWithDistance => entry !== null);

  if (candidates.length === 0) {
    return null;
  }

  const nearest = candidates.reduce<CandidateWithDistance | null>((best, current) => {
    if (!best) {
      return current;
    }
    return current.distance < best.distance ? current : best;
  }, null);

  return nearest ? nearest.port : null;
}

// Debugging reference note:
// Consulted connectionSwitchBehavior.ts and portConnectability.ts to ensure candidate selection
// cooperates with existing connection validation and port filtering logic.
