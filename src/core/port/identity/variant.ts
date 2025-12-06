/**
 * @file Port factory functions for creating Port instances with consistent property copying.
 * Centralizes port creation logic to prevent property omission bugs.
 */
import type { Port, PortPlacement, AbsolutePortPlacement, PortPosition, PortType } from "../../../types/core";
import type { PortDefinition } from "../../../types/NodeDefinition";
import { mergePortDataTypes, toPortDataTypeValue } from "../connectivity/dataType";
import { getPlacementSide } from "../spatiality/placement";

/**
 * Required fields for creating a Port instance
 */
export type PortRequiredFields = {
  id: string;
  type: PortType;
  label: string;
  nodeId: string;
  position: PortPosition;
};

/**
 * Optional fields for creating a Port instance
 */
export type PortOptionalFields = {
  definitionId?: string;
  placement?: PortPlacement | AbsolutePortPlacement;
  dataType?: string | string[];
  maxConnections?: number | "unlimited";
  allowedNodeTypes?: string[];
  allowedPortTypes?: string[];
  instanceIndex?: number;
  instanceTotal?: number;
};

/**
 * All transferable port properties (excludes nodeId as it's context-dependent)
 */
const TRANSFERABLE_PORT_PROPERTIES = [
  "definitionId",
  "placement",
  "dataType",
  "maxConnections",
  "allowedNodeTypes",
  "allowedPortTypes",
  "instanceIndex",
  "instanceTotal",
] as const;

/**
 * Creates a complete Port instance from required and optional fields.
 * Ensures all properties are explicitly handled.
 */
export const createPort = (required: PortRequiredFields, optional: PortOptionalFields = {}): Port => {
  return {
    id: required.id,
    type: required.type,
    label: required.label,
    nodeId: required.nodeId,
    position: required.position,
    definitionId: optional.definitionId,
    placement: optional.placement,
    dataType: optional.dataType,
    maxConnections: optional.maxConnections,
    allowedNodeTypes: optional.allowedNodeTypes,
    allowedPortTypes: optional.allowedPortTypes,
    instanceIndex: optional.instanceIndex,
    instanceTotal: optional.instanceTotal,
  };
};

/**
 * Creates a Port instance by copying all transferable properties from an existing port.
 * Use this when you need a port with a different nodeId but same characteristics.
 */
export const clonePortForNode = (sourcePort: Port, targetNodeId: string): Port => {
  return {
    id: sourcePort.id,
    type: sourcePort.type,
    label: sourcePort.label,
    nodeId: targetNodeId,
    position: sourcePort.position,
    definitionId: sourcePort.definitionId,
    placement: sourcePort.placement,
    dataType: sourcePort.dataType,
    maxConnections: sourcePort.maxConnections,
    allowedNodeTypes: sourcePort.allowedNodeTypes,
    allowedPortTypes: sourcePort.allowedPortTypes,
    instanceIndex: sourcePort.instanceIndex,
    instanceTotal: sourcePort.instanceTotal,
  };
};

/**
 * Creates a minimal Port instance for action state (connection drag, etc.).
 * Copies all properties needed for connection validation.
 */
export const createActionPort = (sourcePort: Port): Port => {
  return {
    id: sourcePort.id,
    type: sourcePort.type,
    label: sourcePort.label,
    nodeId: sourcePort.nodeId,
    position: sourcePort.position,
    definitionId: sourcePort.definitionId,
    placement: sourcePort.placement,
    dataType: sourcePort.dataType,
    maxConnections: sourcePort.maxConnections,
    allowedNodeTypes: sourcePort.allowedNodeTypes,
    allowedPortTypes: sourcePort.allowedPortTypes,
    instanceIndex: sourcePort.instanceIndex,
    instanceTotal: sourcePort.instanceTotal,
  };
};

/**
 * Creates a Port instance from a PortDefinition.
 * Used for creating temporary ports when checking connection compatibility.
 */
export const createPortFromDefinition = (
  definition: PortDefinition,
  nodeId: string,
  placement: PortPlacement | AbsolutePortPlacement,
): Port => {
  const mergedDataTypes = mergePortDataTypes(definition.dataType, definition.dataTypes);
  const resolvedDataType = toPortDataTypeValue(mergedDataTypes);

  return {
    id: definition.id,
    definitionId: definition.id,
    type: definition.type,
    label: definition.label,
    nodeId,
    position: getPlacementSide(placement),
    placement,
    dataType: resolvedDataType,
    maxConnections: definition.maxConnections,
    allowedNodeTypes: undefined,
    allowedPortTypes: undefined,
    instanceIndex: undefined,
    instanceTotal: undefined,
  };
};

/**
 * Validates that a Port instance has all expected properties from its source.
 * Useful for testing to ensure no properties are missed during creation.
 */
export const validatePortCompleteness = (port: Port, source: Port): string[] => {
  const missingProperties: string[] = [];

  for (const prop of TRANSFERABLE_PORT_PROPERTIES) {
    const sourceValue = source[prop];
    const portValue = port[prop];

    if (sourceValue !== undefined && portValue === undefined) {
      missingProperties.push(prop);
    }
  }

  return missingProperties;
};

/**
 * List of all Port property keys for exhaustive checks
 */
export const PORT_PROPERTY_KEYS: ReadonlyArray<keyof Port> = [
  "id",
  "definitionId",
  "type",
  "label",
  "nodeId",
  "position",
  "placement",
  "dataType",
  "maxConnections",
  "allowedNodeTypes",
  "allowedPortTypes",
  "instanceIndex",
  "instanceTotal",
] as const;
