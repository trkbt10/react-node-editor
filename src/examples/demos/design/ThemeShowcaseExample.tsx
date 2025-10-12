/**
 * @file Example preview that highlights how design tokens respond to theme changes.
 */
import * as React from "react";

import classes from "./ThemeShowcaseExample.module.css";

type TokenGroup = {
  title: string;
  tokens: string[];
};

const TOKEN_GROUPS: TokenGroup[] = [
  {
    title: "Surfaces",
    tokens: [
      "--node-editor-surface-primary",
      "--node-editor-surface-secondary",
      "--node-editor-surface-tertiary",
      "--node-editor-window-background-color",
    ],
  },
  {
    title: "Typography",
    tokens: [
      "--node-editor-title-font",
      "--node-editor-control-text-font",
      "--node-editor-theme-default-font-family",
      "--node-editor-font-size-sm",
    ],
  },
  {
    title: "Controls & Accents",
    tokens: [
      "--node-editor-accent-color",
      "--node-editor-accent-color-hover",
      "--node-editor-selected-control-color",
      "--node-editor-keyboard-focus-indicator-color",
    ],
  },
];

type TokenValues = Record<string, string>;

/**
 * Render a theme-aware showcase grid for verifying design token values.
 */
export function ThemeShowcaseExample(): React.ReactElement {
  const [tokenValues, setTokenValues] = React.useState<TokenValues>({});

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const readTokenValues = () => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      const entries = TOKEN_GROUPS.flatMap((group) =>
        group.tokens.map((token) => [token, rootStyles.getPropertyValue(token).trim()]),
      );
      setTokenValues(Object.fromEntries(entries));
    };

    readTokenValues();

    if (typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(readTokenValues);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-node-editor-theme"],
      });

      return () => observer.disconnect();
    }

    return undefined;
  }, []);

  return (
    <div className={classes.container}>
      <section className={classes.preview}>
        <header className={classes.previewHeader}>
          <h2 className={classes.previewTitle}>Theme-driven Surface Preview</h2>
          <p className={classes.previewSubtitle}>
            Switch themes to see how surfaces, accents, and typography respond instantly.
          </p>
        </header>

        <div className={classes.previewContent}>
          <div className={classes.panel}>
            <h3 className={classes.panelTitle}>Surface Stack</h3>
            <div className={`${classes.swatch} ${classes.surfacePrimary}`} />
            <div className={`${classes.swatch} ${classes.surfaceSecondary}`} />
            <div className={`${classes.swatch} ${classes.surfaceTertiary}`} />
          </div>

          <div className={classes.panel}>
            <h3 className={classes.panelTitle}>Accent Button</h3>
            <button className={classes.accent} type="button">
              Active Accent Control
            </button>
            <span>
              Focus ring:{' '}
              <code>{tokenValues["--node-editor-keyboard-focus-indicator-color"] ?? "auto"}</code>
            </span>
          </div>
        </div>
      </section>

      <aside className={classes.tokenGroups}>
        {TOKEN_GROUPS.map((group) => (
          <div key={group.title}>
            <h4 className={classes.tokenGroupTitle}>{group.title}</h4>
            <div className={classes.tokenList}>
              {group.tokens.map((token) => (
                <div className={classes.tokenItem} key={token}>
                  <span className={classes.tokenName}>{token}</span>
                  <code>{tokenValues[token] ?? "—"}</code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}
