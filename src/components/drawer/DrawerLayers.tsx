/**
 * @file DrawerLayers component
 * Renders multiple drawer layers with state management
 */
import * as React from "react";
import type { LayerDefinition } from "../../types/panels";
import { Drawer } from "./Drawer";
import { useDrawerState } from "./useDrawerState";

export type DrawerLayersProps = {
  /** Layers with drawer configuration */
  layers: LayerDefinition[];
};

/**
 * DrawerLayers component
 * Manages and renders all drawer layers
 */
export const DrawerLayers: React.FC<DrawerLayersProps> = ({ layers }) => {
  const { getDrawerState, closeDrawer } = useDrawerState(layers);

  // Filter only layers with drawer configuration
  const drawerLayers = React.useMemo(() => layers.filter((layer) => layer.drawer), [layers]);

  return (
    <>
      {drawerLayers.map((layer) => {
        if (!layer.drawer) {
          return null;
        }

        const isOpen = getDrawerState(layer.id);

        return (
          <Drawer
            key={layer.id}
            id={layer.id}
            config={layer.drawer}
            isOpen={isOpen}
            onClose={() => closeDrawer(layer.id)}
            className={layer.className}
            style={layer.style}
            zIndex={layer.zIndex}
            width={layer.width}
            height={layer.height}
          >
            {layer.component}
          </Drawer>
        );
      })}
    </>
  );
};
