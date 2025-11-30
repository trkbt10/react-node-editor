/**
 * @file Common layout component for examples with header
 */
import * as React from "react";
import classes from "./ExampleLayout.module.css";

type ExampleLayoutProps = {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Layout component that provides consistent structure with header, content, and footer
 */
export function ExampleLayout({ header, children, footer }: ExampleLayoutProps): React.ReactElement {
  return (
    <div className={classes.layout}>
      {header && <div className={classes.headerWrapper}>{header}</div>}
      <main className={classes.content}>{children}</main>
      {footer && <div className={classes.footerWrapper}>{footer}</div>}
    </div>
  );
}
