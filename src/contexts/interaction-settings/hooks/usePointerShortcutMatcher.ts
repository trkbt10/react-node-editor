/**
 * @file React hook for matching pointer events against configured shortcuts.
 */
import * as React from "react";
import type { NodeEditorPointerAction } from "../../../types/interaction";
import { useInteractionSettings } from "../context";
import { isPointerShortcutEvent } from "../../../utils/pointerShortcuts";

export type PointerEventLike = PointerEvent | MouseEvent;

/**
 * Provides a stable matcher that evaluates pointer events against the current shortcut configuration.
 */
export function usePointerShortcutMatcher() {
  const interactionSettings = useInteractionSettings();

  return React.useCallback(
    (action: NodeEditorPointerAction, event: PointerEventLike): boolean => {
      return isPointerShortcutEvent(interactionSettings.pointerShortcuts, action, event);
    },
    [interactionSettings.pointerShortcuts],
  );
}
