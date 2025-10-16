/**
 * @file Renders shortcut binding values for keyboard and pointer interactions.
 */
import * as React from "react";
import type { PointerShortcutDisplay } from "../../../utils/pointerShortcuts";
import styles from "./InspectorShortcutBindingValue.module.css";

type BaseProps = {
  className?: string;
  isCapturing: boolean;
  prompt: string;
  unassignedLabel: string;
};

type KeyboardProps = BaseProps & {
  type: "keyboard";
  label: string | null;
};

type PointerProps = BaseProps & {
  type: "pointer";
  descriptor: PointerShortcutDisplay | null;
};

export type InspectorShortcutBindingValueProps = KeyboardProps | PointerProps;

const mergeClassName = (className?: string): string => {
  return [styles.value, className].filter(Boolean).join(" ");
};

const PointerIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      className={[styles.pointerIcon, className].filter(Boolean).join(" ")}
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2.25 1.5 11 7.08l-3.32.5 1.45 3.86-1.76.67-1.45-3.88-2.74 3.1z"
        fill="currentColor"
      />
    </svg>
  );
};

const renderPointerContent = (descriptor: PointerShortcutDisplay) => {
  const { modifiers, pointerToken, pointerDisplayType, gestureLabel, requireEmptyTarget } = descriptor;
  const elements: React.ReactNode[] = [];

  elements.push(
    <span key="pointer-token" className={styles.pointerGroup}>
      {pointerDisplayType === "mouse" ? <PointerIcon /> : null}
      <span className={styles.pointerToken}>{pointerToken}</span>
      {modifiers.length > 0 ? (
        <>
          <span className={styles.operator}>+</span>
          <span className={styles.modifierGroup}>
            {modifiers.map((modifier, index) => (
              <React.Fragment key={`pointer-modifier-${modifier}-${index}`}>
                {index > 0 ? <span className={styles.operator}>+</span> : null}
                <span className={styles.modifier}>{modifier}</span>
              </React.Fragment>
            ))}
          </span>
        </>
      ) : null}
    </span>,
  );

  const appendOperator = (key: string) => {
    elements.push(
      <span key={key} className={styles.operator}>
        +
      </span>,
    );
  };

  if (gestureLabel) {
    appendOperator("pointer-operator-gesture");
    elements.push(
      <span key="pointer-gesture" className={styles.gesture}>
        {gestureLabel}
      </span>,
    );
  }

  if (requireEmptyTarget) {
    appendOperator("pointer-operator-empty");
    elements.push(
      <span key="pointer-empty" className={styles.suffix}>
        ∅
      </span>,
    );
  }

  return elements;
};

export const InspectorShortcutBindingValue: React.FC<InspectorShortcutBindingValueProps> = (props) => {
  const className = mergeClassName(props.className);

  if (props.isCapturing) {
    return (
      <span className={className} data-state="capturing">
        {props.prompt}
      </span>
    );
  }

  if (props.type === "keyboard") {
    const label = props.label;
    if (!label) {
      return (
        <span className={className} data-state="empty">
          {props.unassignedLabel}
        </span>
      );
    }
    return (
      <span className={className} data-state="value">
        {label}
      </span>
    );
  }

  const descriptor = props.descriptor;
  if (!descriptor) {
    return (
      <span className={className} data-state="empty">
        {props.unassignedLabel}
      </span>
    );
  }

  return (
    <span className={className} data-state="value">
      {renderPointerContent(descriptor)}
    </span>
  );
};

InspectorShortcutBindingValue.displayName = "InspectorShortcutBindingValue";
