/**
 * @file Node definitions demonstrating custom connection rules
 * Shows the 4 ways to customize port connectivity:
 * 1. dataType - type-based compatibility
 * 2. canConnect - port-level predicate
 * 3. validateConnection - node-level validation
 * 4. maxConnections - capacity limits
 */
import type { NodeDefinition, PortConnectionContext } from "../../../../../types/NodeDefinition";

import { invalidConnectionRenderer } from "./connectionRenderer";
import {
  createRulePortRenderer,
  dataTypePortRenderer,
  createCanConnectPortRenderer,
  maxConnectionsPortRenderer,
  createValidateConnectionPortRenderer,
} from "./portRenderer";

// ============================================================================
// 1. Data Type Compatibility
// ============================================================================

/**
 * Number source - outputs "number" type
 */
export const NumberSourceDefinition: NodeDefinition = {
  type: "number-source",
  displayName: "Number Source",
  description: "Outputs a number value",
  category: "Data Types",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "value",
      type: "output",
      label: "Number",
      position: "right",
      dataType: "number",
      renderPort: dataTypePortRenderer,
    },
  ],
};

/**
 * String source - outputs "string" type
 */
export const StringSourceDefinition: NodeDefinition = {
  type: "string-source",
  displayName: "String Source",
  description: "Outputs a string value",
  category: "Data Types",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "value",
      type: "output",
      label: "String",
      position: "right",
      dataType: "string",
      renderPort: dataTypePortRenderer,
    },
  ],
};

/**
 * Number consumer - only accepts "number" type
 */
export const NumberConsumerDefinition: NodeDefinition = {
  type: "number-consumer",
  displayName: "Number Consumer",
  description: "Only accepts number inputs",
  category: "Data Types",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Number",
      position: "left",
      dataType: "number",
      renderPort: dataTypePortRenderer,
    },
  ],
};

/**
 * Any consumer - accepts multiple types using dataTypes array
 */
export const AnyConsumerDefinition: NodeDefinition = {
  type: "any-consumer",
  displayName: "Any Consumer",
  description: "Accepts number or string",
  category: "Data Types",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Any",
      position: "left",
      dataTypes: ["number", "string"],
      renderPort: dataTypePortRenderer,
    },
  ],
};

// ============================================================================
// 2. Port-Level canConnect Predicate
// ============================================================================

/** Port renderer for premium-only connections */
const premiumOnlyPortRenderer = createCanConnectPortRenderer("premium");

/** Port renderer for self-aware connections */
const notSelfPortRenderer = createCanConnectPortRenderer("≠self");

/**
 * Exclusive source - can only connect to nodes of specific types
 */
export const ExclusiveSourceDefinition: NodeDefinition = {
  type: "exclusive-source",
  displayName: "Exclusive Source",
  description: "Only connects to 'premium' nodes",
  category: "canConnect",
  defaultSize: { width: 200, height: 100 },
  ports: [
    {
      id: "premium",
      type: "output",
      label: "Premium Only",
      position: "right",
      canConnect: (context: PortConnectionContext) => {
        // Only allow connections to premium-consumer nodes
        return context.toNode?.type === "premium-consumer";
      },
      renderPort: premiumOnlyPortRenderer,
    },
  ],
};

/**
 * Premium consumer - marked as premium to receive exclusive connections
 */
export const PremiumConsumerDefinition: NodeDefinition = {
  type: "premium-consumer",
  displayName: "Premium Consumer",
  description: "Can receive premium connections",
  category: "canConnect",
  defaultSize: { width: 200, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Premium Input",
      position: "left",
      renderPort: createCanConnectPortRenderer("ok"),
    },
  ],
};

/**
 * Regular consumer - cannot receive exclusive connections
 */
export const RegularConsumerDefinition: NodeDefinition = {
  type: "regular-consumer",
  displayName: "Regular Consumer",
  description: "Cannot receive premium connections",
  category: "canConnect",
  defaultSize: { width: 200, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Regular Input",
      position: "left",
      renderPort: createCanConnectPortRenderer("ng"),
    },
  ],
};

/**
 * Self-aware port - prevents connecting to same node type
 */
export const SelfAwareNodeDefinition: NodeDefinition = {
  type: "self-aware",
  displayName: "Self-Aware Node",
  description: "Cannot connect to another Self-Aware node",
  category: "canConnect",
  defaultSize: { width: 200, height: 120 },
  ports: [
    {
      id: "output",
      type: "output",
      label: "Output",
      position: "right",
      canConnect: (context: PortConnectionContext) => {
        // Prevent connecting to nodes of the same type
        return context.toNode?.type !== "self-aware";
      },
      renderPort: notSelfPortRenderer,
    },
    {
      id: "input",
      type: "input",
      label: "Input",
      position: "left",
      renderPort: notSelfPortRenderer,
    },
  ],
};

// ============================================================================
// 3. Node-Level validateConnection
// ============================================================================

/** Port renderer for validated hub */
const validatedHubPortRenderer = createValidateConnectionPortRenderer("validate");

/**
 * Validated hub - uses node-level validation to limit total connections
 */
export const ValidatedHubDefinition: NodeDefinition = {
  type: "validated-hub",
  displayName: "Validated Hub",
  description: "Max 3 total connections (node-level validation)",
  category: "validateConnection",
  defaultSize: { width: 220, height: 140 },
  ports: [
    {
      id: "in1",
      type: "input",
      label: "Input 1",
      position: "left",
      maxConnections: "unlimited",
      renderPort: validatedHubPortRenderer,
    },
    {
      id: "in2",
      type: "input",
      label: "Input 2",
      position: "left",
      maxConnections: "unlimited",
      renderPort: validatedHubPortRenderer,
    },
    {
      id: "out",
      type: "output",
      label: "Output",
      position: "right",
      maxConnections: "unlimited",
      renderPort: validatedHubPortRenderer,
    },
  ],
  validateConnection: (fromPort, toPort) => {
    // This is a simplified example - in real use you'd check actual connection count
    // This callback is called during validation, returning false prevents the connection
    console.log(`Validating connection: ${fromPort.nodeId}:${fromPort.id} -> ${toPort.nodeId}:${toPort.id}`);
    return true;
  },
};

/** Port renderer for directional node */
const directionalPortRenderer = createValidateConnectionPortRenderer("dir");

/**
 * Directional node - only allows connections in one direction
 */
export const DirectionalNodeDefinition: NodeDefinition = {
  type: "directional",
  displayName: "Directional Node",
  description: "Validates connection direction",
  category: "validateConnection",
  defaultSize: { width: 200, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Input",
      position: "left",
      renderPort: directionalPortRenderer,
    },
    {
      id: "output",
      type: "output",
      label: "Output",
      position: "right",
      renderPort: directionalPortRenderer,
    },
  ],
  validateConnection: (_fromPort, _toPort) => {
    // Only accept connections where this node is the target
    // This is called for both directions, so we check the port ownership
    return true;
  },
};

// ============================================================================
// 4. Capacity Limits (maxConnections)
// ============================================================================

/**
 * Single input - allows only one connection
 */
export const SingleInputDefinition: NodeDefinition = {
  type: "single-input",
  displayName: "Single Input",
  description: "maxConnections: 1 (default)",
  category: "maxConnections",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Single",
      position: "left",
      maxConnections: 1,
      renderPort: maxConnectionsPortRenderer,
    },
  ],
};

/**
 * Limited input - allows up to 3 connections
 */
export const LimitedInputDefinition: NodeDefinition = {
  type: "limited-input",
  displayName: "Limited Input (3)",
  description: "maxConnections: 3",
  category: "maxConnections",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Max 3",
      position: "left",
      maxConnections: 3,
      renderPort: maxConnectionsPortRenderer,
    },
  ],
};

/**
 * Unlimited input - allows unlimited connections
 */
export const UnlimitedInputDefinition: NodeDefinition = {
  type: "unlimited-input",
  displayName: "Unlimited Input",
  description: "maxConnections: 'unlimited'",
  category: "maxConnections",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Unlimited",
      position: "left",
      maxConnections: "unlimited",
      renderPort: maxConnectionsPortRenderer,
    },
  ],
};

/**
 * Multi-output source - provides multiple connections
 */
export const MultiOutputDefinition: NodeDefinition = {
  type: "multi-output",
  displayName: "Multi Output",
  description: "Source for testing capacity",
  category: "maxConnections",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "output",
      type: "output",
      label: "Output",
      position: "right",
      maxConnections: "unlimited",
      renderPort: maxConnectionsPortRenderer,
    },
  ],
};

// ============================================================================
// 5. Abnormal Connection Examples (for demonstration)
// ============================================================================

/** Port renderer for abnormal (invalid) connections */
const abnormalPortRenderer = createRulePortRenderer([{ type: "dataType" }]);

/**
 * Abnormal: String output that's incorrectly connected to number-only input
 * Demonstrates dataType violation
 */
export const AbnormalStringSourceDefinition: NodeDefinition = {
  type: "abnormal-string-source",
  displayName: "String (Invalid)",
  description: "String output connected to number-only input",
  category: "Abnormal",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "value",
      type: "output",
      label: "String",
      position: "right",
      dataType: "string",
      renderPort: abnormalPortRenderer,
      renderConnection: invalidConnectionRenderer,
    },
  ],
};

/**
 * Abnormal: Number input that receives incompatible string
 */
export const AbnormalNumberConsumerDefinition: NodeDefinition = {
  type: "abnormal-number-consumer",
  displayName: "Number Only (Invalid)",
  description: "Receives incompatible string type",
  category: "Abnormal",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Number",
      position: "left",
      dataType: "number",
      renderPort: abnormalPortRenderer,
      renderConnection: invalidConnectionRenderer,
    },
  ],
};

/**
 * Abnormal: Exclusive source connected to regular (non-premium) consumer
 * Demonstrates canConnect violation
 */
export const AbnormalExclusiveSourceDefinition: NodeDefinition = {
  type: "abnormal-exclusive-source",
  displayName: "Exclusive (Invalid)",
  description: "Connected to non-premium consumer",
  category: "Abnormal",
  defaultSize: { width: 200, height: 100 },
  ports: [
    {
      id: "premium",
      type: "output",
      label: "Premium Only",
      position: "right",
      renderPort: createCanConnectPortRenderer("premium"),
      renderConnection: invalidConnectionRenderer,
    },
  ],
};

/**
 * Abnormal: Regular consumer receiving exclusive connection
 */
export const AbnormalRegularConsumerDefinition: NodeDefinition = {
  type: "abnormal-regular-consumer",
  displayName: "Regular (Invalid)",
  description: "Should not receive premium connection",
  category: "Abnormal",
  defaultSize: { width: 200, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Regular",
      position: "left",
      renderPort: createCanConnectPortRenderer("ng"),
      renderConnection: invalidConnectionRenderer,
    },
  ],
};

/**
 * Abnormal: Single input with multiple connections (capacity exceeded)
 */
export const AbnormalOverflowInputDefinition: NodeDefinition = {
  type: "abnormal-overflow-input",
  displayName: "Single (Overflow)",
  description: "Has 2 connections but max is 1",
  category: "Abnormal",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Max 1",
      position: "left",
      maxConnections: 1,
      renderPort: maxConnectionsPortRenderer,
      renderConnection: invalidConnectionRenderer,
    },
  ],
};

/**
 * Abnormal: Multi output for overflow test
 */
export const AbnormalMultiOutputDefinition: NodeDefinition = {
  type: "abnormal-multi-output",
  displayName: "Multi Out",
  description: "Source for overflow test",
  category: "Abnormal",
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "output",
      type: "output",
      label: "Output",
      position: "right",
      maxConnections: "unlimited",
      renderPort: maxConnectionsPortRenderer,
      renderConnection: invalidConnectionRenderer,
    },
  ],
};

// ============================================================================
// Export all definitions
// ============================================================================

export const connectionRulesDefinitions: NodeDefinition[] = [
  // Data Types
  NumberSourceDefinition,
  StringSourceDefinition,
  NumberConsumerDefinition,
  AnyConsumerDefinition,
  // canConnect
  ExclusiveSourceDefinition,
  PremiumConsumerDefinition,
  RegularConsumerDefinition,
  SelfAwareNodeDefinition,
  // validateConnection
  ValidatedHubDefinition,
  DirectionalNodeDefinition,
  // maxConnections
  SingleInputDefinition,
  LimitedInputDefinition,
  UnlimitedInputDefinition,
  MultiOutputDefinition,
  // Abnormal (for demonstration)
  AbnormalStringSourceDefinition,
  AbnormalNumberConsumerDefinition,
  AbnormalExclusiveSourceDefinition,
  AbnormalRegularConsumerDefinition,
  AbnormalOverflowInputDefinition,
  AbnormalMultiOutputDefinition,
];
