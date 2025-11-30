/**
 * @file Section component for the interaction help panel.
 */
import * as React from "react";
import type {
  NodeEditorPointerAction,
  NodeEditorShortcutAction,
} from "../../../../types/interaction";
import { InspectorShortcutButton } from "../../parts/InspectorShortcutButton";
import {
  InteractionHelpItem,
  type SectionItemView,
} from "./InteractionHelpItem";
import styles from "./InteractionHelpSection.module.css";

export type SectionView = {
  id: string;
  title: string;
  items: SectionItemView[];
};

type CaptureState =
  | { type: "keyboard"; action: NodeEditorShortcutAction }
  | { type: "pointer"; action: NodeEditorPointerAction }
  | null;

export type InteractionHelpSectionProps = {
  section: SectionView;
  captureState: CaptureState;
  keyboardPrompt: string;
  pointerPrompt: string;
  unassignedLabel: string;
  resetLabel: string;
  onResetSection: () => void;
  onSelectItem: (item: SectionItemView) => void;
  onResetItem: (item: SectionItemView) => void;
};

const InteractionHelpSectionInner: React.FC<InteractionHelpSectionProps> = ({
  section,
  captureState,
  keyboardPrompt,
  pointerPrompt,
  unassignedLabel,
  resetLabel,
  onResetSection,
  onSelectItem,
  onResetItem,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>{section.title}</div>
        <InspectorShortcutButton onClick={onResetSection}>
          {resetLabel}
        </InspectorShortcutButton>
      </div>
      <ul className={styles.shortcutList}>
        {section.items.map((item) => {
          const isCapturing =
            captureState !== null &&
            captureState.type === item.type &&
            captureState.action === item.action;

          return (
            <InteractionHelpItem
              key={item.key}
              item={item}
              isCapturing={isCapturing}
              keyboardPrompt={keyboardPrompt}
              pointerPrompt={pointerPrompt}
              unassignedLabel={unassignedLabel}
              resetLabel={resetLabel}
              onSelect={() => onSelectItem(item)}
              onReset={() => onResetItem(item)}
            />
          );
        })}
      </ul>
    </div>
  );
};

export const InteractionHelpSection = React.memo(InteractionHelpSectionInner);

InteractionHelpSection.displayName = "InteractionHelpSection";
