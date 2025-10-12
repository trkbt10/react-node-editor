import * as React from "react";
import type { NodeRenderProps } from "../../types/NodeDefinition";
import type { LabelNodeData } from "./types";
import styles from "./label.module.css";































export function LabelNodeRenderer({ node, onStartEdit }: NodeRenderProps<LabelNodeData>): React.ReactElement {
  const d = node.data;
  const title = typeof d.title === "string" ? d.title : undefined;
  const subtitle = typeof d.subtitle === "string" ? d.subtitle : undefined;
  const caption = typeof d.caption === "string" ? d.caption : undefined;
  const align = d.align === 'left' || d.align === 'center' || d.align === 'right' ? d.align : 'center';
  const wrap = d.wrap === 'nowrap' || d.wrap === 'balance' ? d.wrap : 'normal';
  const ellipsis = d.ellipsis === true;
  const alignClass = align === 'left' ? styles.alignLeft : align === 'right' ? styles.alignRight : styles.alignCenter;
  const textColor = typeof d.textColor === 'string' ? d.textColor : undefined;

  return (
    <div className={styles.labelContainer} onDoubleClick={onStartEdit}>
      <div className={[styles.labelInner, alignClass].join(' ')} style={textColor ? { color: textColor } : undefined}>
        {(title || subtitle) && (
          <hgroup className={styles.labelGroup}>
            {title && (
              <h1
                className={[
                  styles.labelTitle,
                  wrap === 'nowrap' ? styles.nowrap : wrap === 'balance' ? styles.wrapBalance : '',
                  ellipsis ? styles.ellipsis : '',
                ].filter(Boolean).join(' ')}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <small
                className={[
                  styles.labelSubtitle,
                  wrap === 'nowrap' ? styles.nowrap : wrap === 'balance' ? styles.wrapBalance : '',
                ].filter(Boolean).join(' ')}
              >
                {subtitle}
              </small>
            )}
          </hgroup>
        )}
        {caption && (
          <p
            className={[
              styles.labelCaption,
              wrap === 'nowrap' ? styles.nowrap : wrap === 'balance' ? styles.wrapBalance : '',
            ].filter(Boolean).join(' ')}
          >
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}

LabelNodeRenderer.displayName = "LabelNodeRenderer";
