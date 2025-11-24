/**
 * @file Individual shortcut item component for the interaction help panel.
 */
import * as React from "react";
import type {
  NodeEditorPointerAction,
  NodeEditorShortcutAction,
} from "../../../../types/interaction";
import type { PointerShortcutDisplay } from "../../../../utils/pointerShortcuts";
import { InspectorShortcutBindingValue } from "../../parts/InspectorShortcutBindingValue";
import styles from "./InteractionHelpItem.module.css";

type PointerGesture = "click" | "drag" | "context-menu";

export type KeyboardItemView = {
  key: string;
  type: "keyboard";
  action: NodeEditorShortcutAction;
  label: string;
  bindingLabel: string | null;
};

export type PointerItemView = {
  key: string;
  type: "pointer";
  action: NodeEditorPointerAction;
  label: string;
  bindingDisplay: PointerShortcutDisplay | null;
  gesture: PointerGesture;
};

export type SectionItemView = KeyboardItemView | PointerItemView;

export type InteractionHelpItemProps = {
  item: SectionItemView;
  isCapturing: boolean;
  keyboardPrompt: string;
  pointerPrompt: string;
  unassignedLabel: string;
  resetLabel: string;
  onSelect: () => void;
  onReset: () => void;
};

const InteractionHelpItemInner: React.FC<InteractionHelpItemProps> = ({
  item,
  isCapturing,
  keyboardPrompt,
  pointerPrompt,
  unassignedLabel,
  resetLabel,
  onSelect,
  onReset,
}) => {
  const hasBinding =
    item.type === "keyboard"
      ? Boolean(item.bindingLabel)
      : item.bindingDisplay !== null;
  const prompt = item.type === "keyboard" ? keyboardPrompt : pointerPrompt;

  const handleResetClick = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onReset();
    },
    [onReset],
  );

  return (
    <li
      className={styles.shortcutItem}
      data-active={isCapturing ? "true" : "false"}
    >
      <span className={styles.shortcutLabel}>{item.label}</span>
      <div className={styles.bindingFieldContainer}>
        <button
          type="button"
          className={styles.bindingField}
          data-state={isCapturing ? "active" : "idle"}
          data-empty={hasBinding ? "false" : "true"}
          onClick={onSelect}
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
            onClick={handleResetClick}
            aria-label={resetLabel}
            title={resetLabel}
          >
            ×
          </button>
        ) : null}
      </div>
    </li>
  );
};

export const InteractionHelpItem = React.memo(InteractionHelpItemInner);

InteractionHelpItem.displayName = "InteractionHelpItem";
