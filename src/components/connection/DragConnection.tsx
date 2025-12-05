/**
 * @file DragConnection coordinator component
 * Coordinates between ConnectingDragConnection and DisconnectingDragConnection
 * based on the current interaction state.
 */
import * as React from "react";
import { useCanvasInteraction } from "../../contexts/composed/canvas/interaction/context";
import { ConnectingDragConnection } from "./ConnectingDragConnection";
import { DisconnectingDragConnection } from "./DisconnectingDragConnection";

const DragConnectionComponent: React.FC = () => {
  const { state: interactionState } = useCanvasInteraction();

  if (interactionState.connectionDragState) {
    return <ConnectingDragConnection />;
  }

  if (interactionState.connectionDisconnectState) {
    return <DisconnectingDragConnection />;
  }

  return null;
};

export const DragConnection = React.memo(DragConnectionComponent);
DragConnection.displayName = "DragConnection";
