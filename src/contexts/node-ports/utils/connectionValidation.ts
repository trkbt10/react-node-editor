import type { Port, Connection } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";

/**
 * Check if two ports can be connected
 */
export const canConnectPorts = (
  fromPort: Port,
  toPort: Port,
  fromNodeDef?: NodeDefinition,
  toNodeDef?: NodeDefinition,
  connections?: Record<string, Connection>
): boolean => {
  // Helper to normalize max: number | "unlimited" | undefined -> number | undefined
  const normalizeMax = (value: number | "unlimited" | undefined, defaultValue: number): number | undefined => {
    if (value === "unlimited") {return undefined;} // no limit
    if (typeof value === "number") {return value;}
    return defaultValue;
  };

  // Basic connection rules
  if (fromPort.type === toPort.type) {return false;} // Same type cannot connect
  if (fromPort.nodeId === toPort.nodeId) {return false;} // Same node cannot connect
  // Same-node connections are already blocked above; allow identical port ids on different nodes
  
  // Ensure proper input/output pairing
  if (fromPort.type === "output" && toPort.type !== "input") {return false;}
  if (fromPort.type === "input" && toPort.type !== "output") {return false;}
  
  // Check if identical connection already exists (match both node and port ids)
  if (connections) {
    const exists = Object.values(connections).some(conn =>
      (conn.fromNodeId === fromPort.nodeId && conn.fromPortId === fromPort.id &&
       conn.toNodeId === toPort.nodeId && conn.toPortId === toPort.id) ||
      (conn.fromNodeId === toPort.nodeId && conn.fromPortId === toPort.id &&
       conn.toNodeId === fromPort.nodeId && conn.toPortId === fromPort.id)
    );
    if (exists) {return false;}
  }
  
  // Check custom validation functions (both must allow)
  if (fromNodeDef?.validateConnection) {
    if (!fromNodeDef.validateConnection(fromPort, toPort)) {return false;}
  }
  if (toNodeDef?.validateConnection) {
    if (!toNodeDef.validateConnection(fromPort, toPort)) {return false;}
  }
  
  // Check data type compatibility if specified
  const fromPortDef = fromNodeDef?.ports?.find(p => p.id === fromPort.id);
  const toPortDef = toNodeDef?.ports?.find(p => p.id === toPort.id);
  
  if (fromPortDef?.dataType && toPortDef?.dataType) {
    if (fromPortDef.dataType !== toPortDef.dataType) {return false;}
  }
  
  // Check max connections limit (default for all ports is 1; "unlimited" removes the limit)
  if (connections) {
    const toMax = normalizeMax(toPortDef?.maxConnections, 1);
    if (toMax !== undefined) {
      const toPortConnections = Object.values(connections).filter(
        conn => conn.toNodeId === toPort.nodeId && conn.toPortId === toPort.id
      );
      if (toPortConnections.length >= toMax) {return false;}
    }
    const fromMax = normalizeMax(fromPortDef?.maxConnections, 1);
    if (fromMax !== undefined) {
      const fromPortConnections = Object.values(connections).filter(
        conn => conn.fromNodeId === fromPort.nodeId && conn.fromPortId === fromPort.id
      );
      if (fromPortConnections.length >= fromMax) {return false;}
    }
  }

  return true;
};

/**
 * Get port definition from node definition
 */
export const getPortDefinition = (
  port: Port,
  nodeDefinition?: NodeDefinition
) => {
  if (!nodeDefinition?.ports) {return undefined;}
  const portDefId = port.id.split('-').pop(); // Extract port def id from full port id
  return nodeDefinition.ports.find(p => p.id === portDefId);
};
