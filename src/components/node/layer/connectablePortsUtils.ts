/**
 * @file Utility functions for connectable ports management.
 */
import type { ConnectablePortsResult } from "../../../contexts/node-ports/utils/connectablePortPlanner";

export const createEmptyConnectablePorts = (): ConnectablePortsResult => ({
  ids: new Set<string>(),
  descriptors: new Map(),
  source: null,
});
