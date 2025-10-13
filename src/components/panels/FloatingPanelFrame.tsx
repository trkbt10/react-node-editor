/**
 * @file Shared floating panel frame components for reusable overlay styling
 */
import * as React from "react";
import { classNames } from "../elements";
import styles from "./FloatingPanelFrame.module.css";

export type FloatingPanelFrameProps = React.HTMLAttributes<HTMLDivElement>;

export const FloatingPanelFrame = React.forwardRef<HTMLDivElement, FloatingPanelFrameProps>(function FloatingPanelFrame(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={classNames(styles.frame, className)} {...rest} />;
});

export type FloatingPanelHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const FloatingPanelHeader: React.FC<FloatingPanelHeaderProps> = ({ className, ...rest }) => {
  return <div className={classNames(styles.header, className)} {...rest} />;
};

export type FloatingPanelTitleProps = React.HTMLAttributes<HTMLSpanElement>;

export const FloatingPanelTitle: React.FC<FloatingPanelTitleProps> = ({ className, ...rest }) => {
  return <span className={classNames(styles.title, className)} {...rest} />;
};

export type FloatingPanelMetaProps = React.HTMLAttributes<HTMLSpanElement>;

export const FloatingPanelMeta: React.FC<FloatingPanelMetaProps> = ({ className, ...rest }) => {
  return <span className={classNames(styles.meta, className)} {...rest} />;
};

export type FloatingPanelControlsProps = React.HTMLAttributes<HTMLDivElement>;

export const FloatingPanelControls: React.FC<FloatingPanelControlsProps> = ({ className, ...rest }) => {
  return <div className={classNames(styles.controls, className)} {...rest} />;
};

export type FloatingPanelContentProps = React.HTMLAttributes<HTMLDivElement>;

export const FloatingPanelContent = React.forwardRef<HTMLDivElement, FloatingPanelContentProps>(
  function FloatingPanelContent({ className, ...rest }, ref) {
    return <div ref={ref} className={classNames(styles.content, className)} {...rest} />;
  },
);

FloatingPanelFrame.displayName = "FloatingPanelFrame";
FloatingPanelHeader.displayName = "FloatingPanelHeader";
FloatingPanelTitle.displayName = "FloatingPanelTitle";
FloatingPanelMeta.displayName = "FloatingPanelMeta";
FloatingPanelControls.displayName = "FloatingPanelControls";
FloatingPanelContent.displayName = "FloatingPanelContent";
