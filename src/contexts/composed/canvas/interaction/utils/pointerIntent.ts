/**
 * @file Shared helpers for classifying canvas pointer interactions.
 */
import type {
  CanvasPanActivator,
  ModifierKey,
  NodeEditorPointerAction,
  PointerType,
} from "../../../../../types/interaction";

export const CANVAS_POINTER_DRAG_THRESHOLD = 4;

export type CanvasPointerIntent = {
  canPan: boolean;
  canRangeSelect: boolean;
  canClearSelection: boolean;
  additiveSelection: boolean;
};

export type CanvasPointerIntentOptions = {
  event: PointerEvent | MouseEvent;
  pointerType: PointerType;
  interactiveTarget: boolean;
  isSpacePanning: boolean;
  panActivators: CanvasPanActivator[];
  matchesPointerAction: (action: NodeEditorPointerAction, event: PointerEvent | MouseEvent) => boolean;
};

export const normalizePointerType = (pointerType?: string | null): PointerType => {
  if (pointerType === "mouse" || pointerType === "touch" || pointerType === "pen") {
    return pointerType;
  }
  return "mouse";
};

export const matchesCanvasPanActivator = (
  event: PointerEvent | MouseEvent,
  activator: CanvasPanActivator,
  pointerType: PointerType,
  interactiveTarget: boolean,
): boolean => {
  if (!activator.pointerTypes.includes(pointerType)) {
    return false;
  }

  if (activator.buttons && !activator.buttons.includes(event.button)) {
    return false;
  }

  if (activator.requireEmptyTarget && interactiveTarget) {
    return false;
  }

  if (activator.modifiers) {
    const modifierKeys = Object.keys(activator.modifiers) as ModifierKey[];
    for (const key of modifierKeys) {
      const required = activator.modifiers[key];
      if (required === undefined) {
        continue;
      }
      if (required && !(event as PointerEvent)[key]) {
        return false;
      }
      if (!required && (event as PointerEvent)[key]) {
        return false;
      }
    }
  }

  return true;
};

export const evaluateCanvasPointerIntent = (options: CanvasPointerIntentOptions): CanvasPointerIntent => {
  if (options.isSpacePanning) {
    return {
      canPan: true,
      canRangeSelect: false,
      canClearSelection: false,
      additiveSelection: options.matchesPointerAction("node-add-to-selection", options.event),
    };
  }

  if (!options.interactiveTarget) {
    const rangeSelection = options.matchesPointerAction("canvas-range-select", options.event);
    if (rangeSelection) {
      return {
        canPan: false,
        canRangeSelect: true,
        canClearSelection: false,
        additiveSelection: options.matchesPointerAction("node-add-to-selection", options.event),
      };
    }
  }

  const canPan = options.panActivators.some((activator) =>
    matchesCanvasPanActivator(options.event, activator, options.pointerType, options.interactiveTarget),
  );

  const canClearSelection =
    !options.isSpacePanning &&
    !options.interactiveTarget &&
    options.matchesPointerAction("canvas-clear-selection", options.event);

  return {
    canPan,
    canRangeSelect: false,
    canClearSelection,
    additiveSelection: options.matchesPointerAction("node-add-to-selection", options.event),
  };
};

export const hasExceededCanvasDragThreshold = (
  start: { x: number; y: number },
  position: { x: number; y: number },
  threshold: number = CANVAS_POINTER_DRAG_THRESHOLD,
): boolean => {
  const deltaX = Math.abs(position.x - start.x);
  const deltaY = Math.abs(position.y - start.y);
  return deltaX > threshold || deltaY > threshold;
};

/*
debug-notes:
- Created shared pointer intent helpers; reviewed src/utils/pointerShortcuts.ts to mirror modifier handling for pan activators.
*/
