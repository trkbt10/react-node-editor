/**
 * @file Inspector panel showing interaction shortcuts sourced from interaction settings.
 */
import * as React from "react";
import {
  useInteractionSettings,
  useInteractionSettingsUpdate,
} from "../../../contexts/InteractionSettingsContext";
import { useI18n } from "../../../i18n/context";
import type { I18nKey } from "../../../i18n/types";
import type {
  NodeEditorPointerAction,
  NodeEditorShortcutAction,
  PointerShortcutBinding,
  PointerType,
  ShortcutBinding,
} from "../../../types/interaction";
import {
  detectShortcutDisplayPlatform,
  getShortcutLabelForAction,
} from "../../../utils/shortcutDisplay";
import {
  describePointerShortcutDisplay,
  getPointerShortcutLabelForAction,
  pointerShortcutBindingFor,
  type PointerShortcutDisplay,
} from "../../../utils/pointerShortcuts";
import { InspectorShortcutButton } from "../parts/InspectorShortcutButton";
import { InspectorShortcutBindingValue } from "../parts/InspectorShortcutBindingValue";
import styles from "./InteractionHelpPanel.module.css";

type PointerGesture = "click" | "drag" | "context-menu";

type BaseDescriptor = {
  id: string;
  labelKey: I18nKey;
};

type KeyboardDescriptor = BaseDescriptor & {
  type: "keyboard";
  action: NodeEditorShortcutAction;
};

type PointerDescriptor = BaseDescriptor & {
  type: "pointer";
  action: NodeEditorPointerAction;
  gesture: PointerGesture;
};

type InteractionDescriptor = KeyboardDescriptor | PointerDescriptor;

type ShortcutSection = {
  id: string;
  titleKey: I18nKey;
  items: InteractionDescriptor[];
};

const INTERACTION_SECTIONS: ShortcutSection[] = [
  {
    id: "pointer",
    titleKey: "inspectorInteractionHelpSectionPointer",
    items: [
      {
        id: "pointer-node-select",
        type: "pointer",
        action: "node-select",
        labelKey: "inspectorInteractionHelpPointerNodeSelect",
        gesture: "click",
      },
      {
        id: "pointer-node-add-selection",
        type: "pointer",
        action: "node-add-to-selection",
        labelKey: "inspectorInteractionHelpPointerNodeMultiSelect",
        gesture: "click",
      },
      {
        id: "pointer-canvas-clear",
        type: "pointer",
        action: "canvas-clear-selection",
        labelKey: "inspectorInteractionHelpPointerCanvasClearSelection",
        gesture: "click",
      },
      {
        id: "pointer-range-select",
        type: "pointer",
        action: "canvas-range-select",
        labelKey: "inspectorInteractionHelpPointerRangeSelect",
        gesture: "drag",
      },
      {
        id: "pointer-canvas-pan",
        type: "pointer",
        action: "canvas-pan",
        labelKey: "inspectorInteractionHelpPointerCanvasPan",
        gesture: "drag",
      },
      {
        id: "pointer-node-context",
        type: "pointer",
        action: "node-open-context-menu",
        labelKey: "inspectorInteractionHelpPointerNodeContextMenu",
        gesture: "context-menu",
      },
      {
        id: "pointer-canvas-context",
        type: "pointer",
        action: "canvas-open-context-menu",
        labelKey: "inspectorInteractionHelpPointerCanvasContextMenu",
        gesture: "context-menu",
      },
    ],
  },
  {
    id: "clipboard",
    titleKey: "inspectorInteractionHelpSectionClipboard",
    items: [
      { id: "copy", type: "keyboard", action: "copy", labelKey: "copy" },
      { id: "cut", type: "keyboard", action: "cut", labelKey: "cut" },
      { id: "paste", type: "keyboard", action: "paste", labelKey: "paste" },
      {
        id: "duplicate-selection",
        type: "keyboard",
        action: "duplicate-selection",
        labelKey: "contextMenuDuplicateNode",
      },
      {
        id: "delete-selection",
        type: "keyboard",
        action: "delete-selection",
        labelKey: "contextMenuDeleteNode",
      },
    ],
  },
  {
    id: "selection",
    titleKey: "inspectorInteractionHelpSectionSelection",
    items: [
      { id: "select-all", type: "keyboard", action: "select-all", labelKey: "selectAll" },
      { id: "clear-selection", type: "keyboard", action: "clear-selection", labelKey: "clearSelection" },
      { id: "add-node", type: "keyboard", action: "add-node", labelKey: "addNode" },
      { id: "auto-layout", type: "keyboard", action: "auto-layout", labelKey: "autoLayout" },
    ],
  },
  {
    id: "history",
    titleKey: "inspectorInteractionHelpSectionHistory",
    items: [
      { id: "undo", type: "keyboard", action: "undo", labelKey: "historyUndo" },
      { id: "redo", type: "keyboard", action: "redo", labelKey: "historyRedo" },
      { id: "save", type: "keyboard", action: "save", labelKey: "save" },
    ],
  },
];

const isModifierKey = (key: string): boolean => {
  return key === "Shift" || key === "Control" || key === "Alt" || key === "Meta";
};

const normalizeKey = (key: string): string => {
  if (key.length === 1) {
    return key.toLowerCase();
  }
  return key;
};

const createShortcutBindingFromEvent = (event: KeyboardEvent): ShortcutBinding => {
  const binding: ShortcutBinding = {
    key: normalizeKey(event.key),
  };
  if (event.ctrlKey) {
    binding.ctrl = true;
  }
  if (event.metaKey) {
    binding.meta = true;
  }
  if (event.shiftKey) {
    binding.shift = true;
  }
  if (event.altKey) {
    binding.alt = true;
  }
  return binding;
};

const pointerModifiersFromEvent = (event: PointerEvent): PointerShortcutBinding["modifiers"] | undefined => {
  const modifiers: PointerShortcutBinding["modifiers"] = {};
  if (event.ctrlKey) {
    modifiers.ctrl = true;
  }
  if (event.metaKey) {
    modifiers.meta = true;
  }
  if (event.shiftKey) {
    modifiers.shift = true;
  }
  if (event.altKey) {
    modifiers.alt = true;
  }
  const keys = Object.keys(modifiers);
  if (keys.length === 0) {
    return undefined;
  }
  return modifiers;
};

const createPointerBindingFromEvent = (
  event: PointerEvent,
  options?: { requireEmptyTarget?: boolean },
): PointerShortcutBinding => {
  const binding: PointerShortcutBinding = {
    button: event.button,
  };
  if (event.pointerType === "mouse" || event.pointerType === "pen" || event.pointerType === "touch") {
    binding.pointerTypes = [event.pointerType as PointerType];
  }
  const clickCount = Math.max(event.detail || 0, 1);
  if (clickCount > 1) {
    binding.clickCount = clickCount;
  }
  const modifiers = pointerModifiersFromEvent(event);
  if (modifiers) {
    binding.modifiers = modifiers;
  }
  if (options?.requireEmptyTarget) {
    binding.requireEmptyTarget = true;
  }
  return binding;
};

type CaptureState =
  | { type: "keyboard"; action: NodeEditorShortcutAction }
  | { type: "pointer"; action: NodeEditorPointerAction }
  | null;

type SectionItemView =
  | {
      key: string;
      type: "keyboard";
      action: NodeEditorShortcutAction;
      label: string;
      bindingLabel: string | null;
    }
  | {
      key: string;
      type: "pointer";
      action: NodeEditorPointerAction;
      label: string;
      bindingDisplay: PointerShortcutDisplay | null;
      gesture: PointerGesture;
    };

type SectionView = {
  id: string;
  title: string;
  items: SectionItemView[];
};

const POINTER_DOUBLE_CLICK_CAPTURE_DELAY_MS = 300;

export const InteractionHelpPanel: React.FC = () => {
  const interactionSettings = useInteractionSettings();
  const {
    setKeyboardShortcutBindings,
    resetKeyboardShortcut,
    setPointerShortcutBinding,
    resetPointerShortcut,
  } = useInteractionSettingsUpdate();
  const { t } = useI18n();
  const platform = React.useMemo(() => detectShortcutDisplayPlatform(), []);
  const [captureState, setCaptureState] = React.useState<CaptureState>(null);
  const pendingPointerBindingRef = React.useRef<{ binding: PointerShortcutBinding; timeoutId: number | null } | null>(
    null,
  );

  const unassignedLabel = t("inspectorInteractionHelpUnassigned") || "Not assigned";
  const resetLabel = t("inspectorInteractionHelpReset") || "Reset";
  const keyboardPrompt = t("inspectorInteractionHelpKeyboardPrompt") || "Press keys, Esc to cancel";
  const pointerPrompt = t("inspectorInteractionHelpPointerPrompt") || "Click or press, Esc to cancel";

  const sections = React.useMemo<SectionView[]>(() => {
    const keyboardShortcuts = interactionSettings.keyboardShortcuts;
    const pointerShortcuts = interactionSettings.pointerShortcuts;
    return INTERACTION_SECTIONS.map((section) => ({
      id: section.id,
      title: t(section.titleKey) || section.titleKey,
      items: section.items.map<SectionItemView>((descriptor) => {
        const label = t(descriptor.labelKey) || descriptor.labelKey;
        if (descriptor.type === "keyboard") {
          const bindingLabel = getShortcutLabelForAction(keyboardShortcuts, descriptor.action, platform);
          return {
            key: descriptor.id,
            type: "keyboard",
            action: descriptor.action,
            label,
            bindingLabel,
          };
        }
        const binding = pointerShortcutBindingFor(pointerShortcuts, descriptor.action);
        const rawBindingLabel = getPointerShortcutLabelForAction(pointerShortcuts, descriptor.action, {
          gesture: descriptor.gesture,
        });
        const bindingDisplay =
          binding && rawBindingLabel
            ? describePointerShortcutDisplay(binding, { gesture: descriptor.gesture })
            : null;
        return {
          key: descriptor.id,
          type: "pointer",
          action: descriptor.action,
          label,
          bindingDisplay,
          gesture: descriptor.gesture,
        };
      }),
    }));
  }, [interactionSettings.keyboardShortcuts, interactionSettings.pointerShortcuts, platform, t]);

  React.useEffect(() => {
    if (!captureState || captureState.type !== "keyboard") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        setCaptureState(null);
        return;
      }
      if (isModifierKey(event.key)) {
        return;
      }

      const binding = createShortcutBindingFromEvent(event);
      setKeyboardShortcutBindings(captureState.action, [binding]);
      setCaptureState(null);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [captureState, setKeyboardShortcutBindings]);

  React.useEffect(() => {
    if (!captureState || captureState.type !== "pointer") {
      return;
    }

    const clearPending = () => {
      const pending = pendingPointerBindingRef.current;
      if (pending && pending.timeoutId !== null) {
        window.clearTimeout(pending.timeoutId);
      }
      pendingPointerBindingRef.current = null;
    };

    const finalizeBinding = (binding: PointerShortcutBinding) => {
      clearPending();
      setPointerShortcutBinding(captureState.action, binding);
      setCaptureState(null);
    };

    const scheduleSingleBinding = (binding: PointerShortcutBinding) => {
      clearPending();
      const timeoutId = window.setTimeout(() => {
        finalizeBinding(binding);
      }, POINTER_DOUBLE_CLICK_CAPTURE_DELAY_MS);
      pendingPointerBindingRef.current = { binding, timeoutId };
    };

    const handlePointerDown = (event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const binding = createPointerBindingFromEvent(event, {
        requireEmptyTarget: captureState.action === "canvas-pan",
      });
      const clickCount = Math.max(event.detail || 0, 1);
      if (clickCount > 1) {
        binding.clickCount = clickCount;
        finalizeBinding(binding);
        return;
      }
      scheduleSingleBinding(binding);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        clearPending();
        setCaptureState(null);
      }
    };

    const handleWindowBlur = () => {
      clearPending();
      setCaptureState(null);
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      clearPending();
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [captureState, setPointerShortcutBinding]);

  return (
    <div className={styles.panel}>
      {sections.map((section) => (
        <div key={section.id} className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>{section.title}</div>
            <InspectorShortcutButton
              onClick={() => {
                section.items.forEach((item) => {
                  if (item.type === "keyboard") {
                    resetKeyboardShortcut(item.action);
                    return;
                  }
                  resetPointerShortcut(item.action);
                });
                setCaptureState(null);
              }}
            >
              {resetLabel}
            </InspectorShortcutButton>
          </div>
          <ul className={styles.shortcutList}>
            {section.items.map((item) => {
              const isCapturing =
                captureState !== null &&
                captureState.type === item.type &&
                captureState.action === item.action;
              const hasBinding =
                item.type === "keyboard"
                  ? Boolean(item.bindingLabel)
                  : item.bindingDisplay !== null;
              const prompt = item.type === "keyboard" ? keyboardPrompt : pointerPrompt;

              const handleSelect = () => {
                if (isCapturing) {
                  setCaptureState(null);
                  return;
                }
                if (item.type === "keyboard") {
                  setCaptureState({ type: "keyboard", action: item.action });
                } else {
                  setCaptureState({ type: "pointer", action: item.action });
                }
              };

              const handleReset = () => {
                if (item.type === "keyboard") {
                  resetKeyboardShortcut(item.action);
                } else {
                  resetPointerShortcut(item.action);
                }
                setCaptureState(null);
              };

              return (
                <li key={item.key} className={styles.shortcutItem} data-active={isCapturing ? "true" : "false"}>
                  <span className={styles.shortcutLabel}>{item.label}</span>
                  <div className={styles.bindingFieldContainer}>
                    <button
                      type="button"
                      className={styles.bindingField}
                      data-state={isCapturing ? "active" : "idle"}
                      data-empty={hasBinding ? "false" : "true"}
                      onClick={handleSelect}
                    >
                      {item.type === "keyboard" ? (
                        <InspectorShortcutBindingValue
                          type="keyboard"
                          className={styles.bindingValue}
                          isCapturing={isCapturing}
                          prompt={prompt}
                          unassignedLabel={unassignedLabel}
                          label={item.bindingLabel}
                        />
                      ) : (
                        <InspectorShortcutBindingValue
                          type="pointer"
                          className={styles.bindingValue}
                          isCapturing={isCapturing}
                          prompt={prompt}
                          unassignedLabel={unassignedLabel}
                          descriptor={item.bindingDisplay}
                        />
                      )}
                    </button>
                    {isCapturing ? (
                      <button
                        type="button"
                        className={styles.bindingResetButton}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleReset();
                        }}
                        aria-label={resetLabel}
                        title={resetLabel}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

InteractionHelpPanel.displayName = "InteractionHelpPanel";

/*
debug-notes:
- Reviewed pointer shortcut formatting utilities to ensure inspector editing renders consistent labels.
- Consulted InteractionSettingsContext to confirm inline resets should restore default shortcut assignments.
- Revisited pointer shortcut utilities to derive compact binding notation.
- Added binding value component to centralize compact pointer display formatting.
*/
