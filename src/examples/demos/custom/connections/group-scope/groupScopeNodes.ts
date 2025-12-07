/**
 * @file Node definitions demonstrating canConnect for group scope ports
 * Shows how canConnect can override default dataType checking to allow
 * child nodes to connect to parent group's scope-in port regardless of type.
 */
import type { NodeDefinition } from "../../../../../types/NodeDefinition";

/**
 * Group container node with scope ports.
 * - scope-out: Provides data from parent to children (top)
 * - scope-in: Collects results from children (bottom)
 *
 * The scope-in port uses canConnect: () => true to accept any data type,
 * allowing child nodes with various output types to connect.
 */
export const GroupContainerDefinition: NodeDefinition = {
  type: "group-container",
  displayName: "Group Container",
  description: "A group node with scope ports for parent-child data flow",
  category: "Groups",
  behaviors: ["node", { type: "group", autoGroup: true }],
  defaultSize: { width: 400, height: 300 },
  ports: [
    // External input (left side)
    {
      id: "data-in",
      type: "input",
      label: "Data In",
      position: "left",
      dataType: "any",
      // Accept any type for external input
      canConnect: () => true,
    },
    // External output (right side)
    {
      id: "data-out",
      type: "output",
      label: "Data Out",
      position: "right",
      dataType: "any",
    },
    // Scope output - provides data to children (top)
    {
      id: "scope-out",
      type: "output",
      label: "To Children",
      position: "top",
      dataType: "any",
    },
    // Scope input - collects results from children (bottom)
    // Uses canConnect to accept ANY type from child nodes
    {
      id: "scope-in",
      type: "input",
      label: "From Children",
      position: "bottom",
      dataType: "result", // This type normally wouldn't match "string" or "number"
      // canConnect overrides default dataType checking
      // Returns true to accept connections regardless of type mismatch
      canConnect: () => true,
    },
  ],
};

/**
 * Text processor node - outputs string type.
 * Can be placed inside the group and connect to scope-in.
 */
export const TextProcessorDefinition: NodeDefinition = {
  type: "text-processor",
  displayName: "Text Processor",
  description: "Processes text and outputs a string",
  category: "Processors",
  defaultSize: { width: 160, height: 80 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Input",
      position: "left",
      dataType: "any",
      canConnect: () => true,
    },
    {
      id: "output",
      type: "output",
      label: "String",
      position: "right",
      dataType: "string",
    },
  ],
};

/**
 * Number calculator node - outputs number type.
 * Can be placed inside the group and connect to scope-in.
 */
export const NumberCalculatorDefinition: NodeDefinition = {
  type: "number-calculator",
  displayName: "Number Calculator",
  description: "Performs calculations and outputs a number",
  category: "Processors",
  defaultSize: { width: 160, height: 80 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Input",
      position: "left",
      dataType: "any",
      canConnect: () => true,
    },
    {
      id: "output",
      type: "output",
      label: "Number",
      position: "right",
      dataType: "number",
    },
  ],
};

/**
 * Object builder node - outputs object type.
 * Can be placed inside the group and connect to scope-in.
 */
export const ObjectBuilderDefinition: NodeDefinition = {
  type: "object-builder",
  displayName: "Object Builder",
  description: "Builds an object from inputs",
  category: "Processors",
  defaultSize: { width: 160, height: 80 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Input",
      position: "left",
      dataType: "any",
      canConnect: () => true,
    },
    {
      id: "output",
      type: "output",
      label: "Object",
      position: "right",
      dataType: "object",
    },
  ],
};

/**
 * Strict typed consumer - does NOT use canConnect,
 * so default dataType checking applies.
 * Only accepts "number" type connections.
 */
export const StrictTypedConsumerDefinition: NodeDefinition = {
  type: "strict-typed-consumer",
  displayName: "Strict Consumer",
  description: "Only accepts number type (no canConnect override)",
  category: "Consumers",
  defaultSize: { width: 180, height: 80 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Number Only",
      position: "left",
      dataType: "number",
      // No canConnect - uses default dataType checking
    },
  ],
};

/**
 * External data source for feeding into the group.
 */
export const DataSourceDefinition: NodeDefinition = {
  type: "data-source",
  displayName: "Data Source",
  description: "Provides data to feed into group",
  category: "Sources",
  defaultSize: { width: 140, height: 60 },
  ports: [
    {
      id: "output",
      type: "output",
      label: "Data",
      position: "right",
      dataType: "any",
    },
  ],
};

/**
 * External result receiver from the group.
 */
export const ResultReceiverDefinition: NodeDefinition = {
  type: "result-receiver",
  displayName: "Result Receiver",
  description: "Receives processed results from group",
  category: "Consumers",
  defaultSize: { width: 140, height: 60 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Result",
      position: "left",
      dataType: "any",
      canConnect: () => true,
    },
  ],
};

/** All node definitions for the group scope example */
export const groupScopeDefinitions: NodeDefinition[] = [
  GroupContainerDefinition,
  TextProcessorDefinition,
  NumberCalculatorDefinition,
  ObjectBuilderDefinition,
  StrictTypedConsumerDefinition,
  DataSourceDefinition,
  ResultReceiverDefinition,
];
