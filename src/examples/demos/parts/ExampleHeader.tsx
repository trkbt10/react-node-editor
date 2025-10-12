/**
 * @file Common header component for examples
 */
import * as React from "react";
import classes from "./ExampleHeader.module.css";

type ExampleHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

/**
 * Header component that provides consistent title and description layout
 */
export function ExampleHeader({ title, description, actions }: ExampleHeaderProps): React.ReactElement {
  return (
    <header className={classes.header}>
      <div className={classes.content}>
        <h2 className={classes.title}>{title}</h2>
        {description && <p className={classes.description}>{description}</p>}
      </div>
      {actions && <div className={classes.actions}>{actions}</div>}
    </header>
  );
}
