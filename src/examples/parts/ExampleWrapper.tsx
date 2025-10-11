/**
 * @file Common wrapper component for examples
 */
import * as React from "react";
import classes from "./ExampleWrapper.module.css";

type ExampleWrapperProps = {
  children: React.ReactNode;
};

/**
 * Wrapper component that provides consistent full-screen layout for examples
 */
export function ExampleWrapper({ children }: ExampleWrapperProps): React.ReactElement {
  return <div className={classes.wrapper}>{children}</div>;
}
