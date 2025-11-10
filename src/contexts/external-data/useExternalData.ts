/**
 * @file Hook for managing external data loading and updates for nodes
 */
import * as React from "react";
import type { Node } from "../../types/core";
import type { ExternalDataReference } from "../../types/NodeDefinition";
import { useNodeDefinition } from "../node-definitions/hooks/useNodeDefinition";

/**
 * External data state
 */
export type ExternalDataState = {
  data: unknown;
  isLoading: boolean;
  error: Error | null;
};

/**
 * External data state with actions
 */
export type ExternalDataStateWithActions = ExternalDataState & {
  refresh: () => void;
  update: (data: unknown) => Promise<void>;
};

/**
 * Comparison result for external data state changes
 */
export type ExternalDataStateComparison = {
  objectChanged: boolean;
  dataChanged: boolean;
  isLoadingChanged: boolean;
  errorChanged: boolean;
  refreshChanged: boolean;
  updateChanged: boolean;
};

/**
 * Compare two external data states and return detailed comparison
 */
export function compareExternalDataStates(
  prev: ExternalDataStateWithActions | null | undefined,
  next: ExternalDataStateWithActions | null | undefined,
): ExternalDataStateComparison {
  return {
    objectChanged: prev !== next,
    dataChanged: prev?.data !== next?.data,
    isLoadingChanged: prev?.isLoading !== next?.isLoading,
    errorChanged: prev?.error !== next?.error,
    refreshChanged: prev?.refresh !== next?.refresh,
    updateChanged: prev?.update !== next?.update,
  };
}

/**
 * Check if external data states are equal (shallow comparison of values)
 */
export function areExternalDataStatesEqual(
  prev: ExternalDataStateWithActions | null | undefined,
  next: ExternalDataStateWithActions | null | undefined,
): boolean {
  if (prev === next) {
    return true;
  }
  if (!prev || !next) {
    return false;
  }
  return (
    prev.data === next.data &&
    prev.isLoading === next.isLoading &&
    prev.error === next.error &&
    prev.refresh === next.refresh &&
    prev.update === next.update
  );
}

/**
 * Hook for managing external data for a node
 */
export function useExternalData(
  node: Node | null,
  externalRef?: ExternalDataReference,
): ExternalDataStateWithActions {
  const definition = useNodeDefinition(node?.type || "");
  const [state, setState] = React.useState<ExternalDataState>({
    data: undefined,
    isLoading: false,
    error: null,
  });

  // Load external data
  const loadData = React.useCallback(async () => {
    if (!node || !externalRef || !definition?.loadExternalData) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await Promise.resolve(definition.loadExternalData(externalRef));
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: undefined,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [node, externalRef, definition]);

  // Initial load
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Update external data
  const update = React.useCallback(
    async (data: unknown) => {
      if (!node || !externalRef || !definition?.updateExternalData) {
        throw new Error("Cannot update external data: missing requirements");
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await Promise.resolve(definition.updateExternalData(externalRef, data));
        // Optimistically update local state
        setState({ data, isLoading: false, error: null });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
        throw error;
      }
    },
    [node, externalRef, definition],
  );

  return React.useMemo(
    () => ({
      ...state,
      refresh: loadData,
      update,
    }),
    [state, loadData, update],
  );
}

/**
 * Hook for managing multiple external data references
 */
export function useExternalDataMap(
  nodes: Record<string, Node>,
  externalRefs: Record<string, ExternalDataReference>,
): Record<string, ExternalDataState> {
  const [dataMap, setDataMap] = React.useState<Record<string, ExternalDataState>>({});

  React.useEffect(() => {
    const loadAllData = async () => {
      const newDataMap: Record<string, ExternalDataState> = {};

      await Promise.all(
        Object.entries(nodes).map(async ([nodeId, _node]) => {
          const externalRef = externalRefs[nodeId];
          if (!externalRef) {
            newDataMap[nodeId] = {
              data: undefined,
              isLoading: false,
              error: null,
            };
            return;
          }

          // This would need to be implemented with proper definition lookup
          newDataMap[nodeId] = {
            data: undefined,
            isLoading: true,
            error: null,
          };
        }),
      );

      setDataMap(newDataMap);
    };

    loadAllData();
  }, [nodes, externalRefs]);

  return dataMap;
}
