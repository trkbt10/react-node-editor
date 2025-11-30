/**
 * @file Example preview that highlights how design tokens respond to theme changes.
 */
import * as React from "react";

import { Button } from "../../../../components/elements/Button";
import { H2, H3, H4 } from "../../../../components/elements/Heading";
import { Label } from "../../../../components/elements/Label";
import { PropertySection } from "../../../../components/inspector/parts/PropertySection";
import { InspectorField } from "../../../../components/inspector/parts/InspectorField";
import { ReadOnlyField } from "../../../../components/inspector/parts/ReadOnlyField";
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
      <div className={classes.preview}>
        <div className={classes.previewHeader}>
          <H2 size="lg" weight="semibold">
            Theme-driven Component Showcase
          </H2>
          <p className={classes.previewSubtitle}>
            Switch themes to see how components, surfaces, and accents respond instantly.
          </p>
        </div>

        <div className={classes.previewContent}>
          <PropertySection title="Surface Examples">
            <div className={classes.surfaceStack}>
              <div className={`${classes.swatch} ${classes.surfacePrimary}`}>
                <Label>Primary Surface</Label>
              </div>
              <div className={`${classes.swatch} ${classes.surfaceSecondary}`}>
                <Label>Secondary Surface</Label>
              </div>
              <div className={`${classes.swatch} ${classes.surfaceTertiary}`}>
                <Label>Tertiary Surface</Label>
              </div>
            </div>
          </PropertySection>

          <PropertySection title="Button Variants">
            <div className={classes.buttonGrid}>
              <Button variant="primary" size="medium">
                Primary
              </Button>
              <Button variant="secondary" size="medium">
                Secondary
              </Button>
              <Button variant="danger" size="medium">
                Danger
              </Button>
              <Button variant="ghost" size="medium">
                Ghost
              </Button>
            </div>
          </PropertySection>

          <PropertySection title="Typography Examples">
            <div className={classes.typographyStack}>
              <H2 size="2xl" weight="bold">
                Heading Level 2
              </H2>
              <H3 size="lg" weight="semibold">
                Heading Level 3
              </H3>
              <H4 size="md" weight="medium">
                Heading Level 4
              </H4>
              <Label>Label Component</Label>
            </div>
          </PropertySection>
        </div>
      </div>

      <div className={classes.tokenGroups}>
        {TOKEN_GROUPS.map((group) => (
          <PropertySection key={group.title} title={group.title}>
            <div className={classes.tokenList}>
              {group.tokens.map((token) => (
                <InspectorField key={token} label={token}>
                  <ReadOnlyField>
                    <code>{tokenValues[token] ?? "—"}</code>
                  </ReadOnlyField>
                </InspectorField>
              ))}
            </div>
          </PropertySection>
        ))}
      </div>
    </div>
  );
}
