/**
 * @file Hook for managing drawer state (controlled/uncontrolled)
 */
import * as React from "react";
import type { LayerDefinition } from "../../types/panels";

/**
 * Hook to manage drawer state
 * Supports both controlled and uncontrolled modes
 */
export const useDrawerState = (layers: LayerDefinition[]) => {
  // Internal state for uncontrolled drawers
  const [drawerStates, setDrawerStates] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    layers.forEach((layer) => {
      if (layer.drawer) {
        initial[layer.id] = layer.drawer.defaultOpen ?? false;
      }
    });
    return initial;
  });

  // Get effective drawer state (controlled or uncontrolled)
  const getDrawerState = React.useCallback(
    (layerId: string): boolean => {
      const layer = layers.find((l) => l.id === layerId);
      if (!layer?.drawer) {
        return false;
      }
      // If drawer.open is provided, use it (controlled)
      if (layer.drawer.open !== undefined) {
        return layer.drawer.open;
      }
      // Otherwise use internal state (uncontrolled)
      return drawerStates[layerId] ?? false;
    },
    [layers, drawerStates],
  );

  // Close drawer (for backdrop clicks and close button)
  const closeDrawer = React.useCallback(
    (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId);
      // For controlled drawers, just notify
      if (layer?.drawer?.open !== undefined) {
        layer.drawer.onStateChange?.(false);
        return;
      }
      // For uncontrolled drawers, update internal state
      setDrawerStates((prev) => {
        if (!prev[layerId]) {
          return prev;
        }
        layer?.drawer?.onStateChange?.(false);
        return { ...prev, [layerId]: false };
      });
    },
    [layers],
  );

  return {
    getDrawerState,
    closeDrawer,
  };
};
