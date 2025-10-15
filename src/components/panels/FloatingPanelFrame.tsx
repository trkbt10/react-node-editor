/**
 * @file Shared floating panel frame components for reusable overlay styling
 */
import * as React from "react";
import styles from "./FloatingPanelFrame.module.css";

export type FloatingPanelFrameProps = React.HTMLAttributes<HTMLDivElement>;

export const FloatingPanelFrame = React.forwardRef<HTMLDivElement, FloatingPanelFrameProps>(function FloatingPanelFrame(
  { className, ...rest },
  ref,
) {
  const frameClassName = className ? `${styles.frame} ${className}` : styles.frame;
  return <div ref={ref} className={frameClassName} {...rest} />;
});

export type FloatingPanelHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const FloatingPanelHeader: React.FC<FloatingPanelHeaderProps> = ({ className, ...rest }) => {
  const headerClassName = className ? `${styles.header} ${className}` : styles.header;
  return <div className={headerClassName} {...rest} />;
};

export type FloatingPanelTitleProps = React.HTMLAttributes<HTMLSpanElement>;

export const FloatingPanelTitle: React.FC<FloatingPanelTitleProps> = ({ className, ...rest }) => {
  const titleClassName = className ? `${styles.title} ${className}` : styles.title;
  return <span className={titleClassName} {...rest} />;
};

export type FloatingPanelMetaProps = React.HTMLAttributes<HTMLSpanElement>;

export const FloatingPanelMeta: React.FC<FloatingPanelMetaProps> = ({ className, ...rest }) => {
  const metaClassName = className ? `${styles.meta} ${className}` : styles.meta;
  return <span className={metaClassName} {...rest} />;
};

export type FloatingPanelControlsProps = React.HTMLAttributes<HTMLDivElement>;

export const FloatingPanelControls: React.FC<FloatingPanelControlsProps> = ({ className, ...rest }) => {
  const controlsClassName = className ? `${styles.controls} ${className}` : styles.controls;
  return <div className={controlsClassName} {...rest} />;
};

export type FloatingPanelContentProps = React.HTMLAttributes<HTMLDivElement>;

export const FloatingPanelContent = React.forwardRef<HTMLDivElement, FloatingPanelContentProps>(
  function FloatingPanelContent({ className, ...rest }, ref) {
    const contentClassName = className ? `${styles.content} ${className}` : styles.content;
    return <div ref={ref} className={contentClassName} {...rest} />;
  },
);

FloatingPanelFrame.displayName = "FloatingPanelFrame";
FloatingPanelHeader.displayName = "FloatingPanelHeader";
FloatingPanelTitle.displayName = "FloatingPanelTitle";
FloatingPanelMeta.displayName = "FloatingPanelMeta";
FloatingPanelControls.displayName = "FloatingPanelControls";
FloatingPanelContent.displayName = "FloatingPanelContent";
