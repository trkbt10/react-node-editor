/**
 * @file Utility functions for connectable ports management.
 */
import type { ConnectablePortsResult } from "./connectablePortPlanner";

export const createEmptyConnectablePorts = (): ConnectablePortsResult => ({
  ids: new Set<string>(),
  descriptors: new Map(),
  source: null,
});
