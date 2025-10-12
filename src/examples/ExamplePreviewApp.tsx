/**
 * @file Shell UI that lets developers switch between example scenarios
 */
import * as React from "react";

import { applyTheme, getStoredThemeId, listAvailableThemes } from "./themes/registry";
import type { NodeEditorThemeId } from "./themes/registry";
import { ConstrainedNodeExample } from "./demos/ConstrainedNodeExample";
import { TypedNodesExample } from "./demos/TypedNodesExample";
import { AdvancedNodeExample } from "./demos/AdvancedNodeExample";
import { CustomPortRendererExample } from "./demos/CustomPortRendererExample";
import { I18nPlaygroundExample } from "./demos/I18nPlaygroundExample";
import {
  DefaultLayoutExample,
  CustomInspectorWidthExample,
  CanvasOnlyExample,
  WithToolbarExample,
} from "./demos/ColumnLayoutExample";
import { AdvancedLayoutExample } from "./demos/AdvancedLayoutExample";
import { ThreeJsExample } from "./demos/threejs/ThreeJsExample";
import CustomNodeExample from "./demos/CustomNodeExample";
import { ThemeShowcaseExample } from "./demos/design/ThemeShowcaseExample";
import classes from "./ExamplePreviewApp.module.css";

type ExampleEntry = {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
  category: "basic" | "advanced" | "layout" | "design";
};

const examples: ExampleEntry[] = [
  {
    id: "threejs-integration",
    title: "Three.js Integration",
    description: "Drive a Three.js scene by connecting node outputs to a live preview.",
    component: ThreeJsExample,
    category: "advanced",
  },
  {
    id: "i18n-playground",
    title: "Internationalization Playground",
    description: "Configure locale, fallback, and message overrides to validate translations.",
    component: I18nPlaygroundExample,
    category: "advanced",
  },
  {
    id: "custom-node",
    title: "Custom Nodes with External Data",
    description: "Shows how to connect custom renderers to external data sources.",
    component: CustomNodeExample,
    category: "basic",
  },
  {
    id: "typed-nodes",
    title: "Typed Node Definitions",
    description: "Demonstrates strongly-typed node definitions with custom renderers.",
    component: TypedNodesExample,
    category: "basic",
  },
  {
    id: "constrained-nodes",
    title: "Constrained Node Definitions",
    description: "Highlights constraint helpers for placement and connection rules.",
    component: ConstrainedNodeExample,
    category: "basic",
  },
  {
    id: "advanced-node",
    title: "Advanced Node Examples",
    description: "Complex nodes with Code Editor, Chart Visualization, and Form Builder.",
    component: AdvancedNodeExample,
    category: "advanced",
  },
  {
    id: "custom-port-renderer",
    title: "Custom Port Renderer",
    description: "Customize port and connection appearance with custom renderers.",
    component: CustomPortRendererExample,
    category: "basic",
  },
  {
    id: "layout-default",
    title: "Layout: Default",
    description: "Default layout with canvas and inspector.",
    component: DefaultLayoutExample,
    category: "layout",
  },
  {
    id: "layout-custom-inspector",
    title: "Layout: Custom Inspector Width",
    description: "Layout with wider, resizable inspector panel.",
    component: CustomInspectorWidthExample,
    category: "layout",
  },
  {
    id: "layout-canvas-only",
    title: "Layout: Canvas Only",
    description: "Layout with canvas only (no inspector).",
    component: CanvasOnlyExample,
    category: "layout",
  },
  {
    id: "layout-with-toolbar",
    title: "Layout: With Toolbar",
    description: "Layout with custom toolbar and inspector.",
    component: WithToolbarExample,
    category: "layout",
  },
  {
    id: "layout-advanced",
    title: "Layout: Advanced (Kitchen Sink)",
    description: "Advanced layout with floating sidebar, minimap, grid toolbox, status bar, and more.",
    component: AdvancedLayoutExample,
    category: "layout",
  },
  {
    id: "design-theme-showcase",
    title: "Design: Theme Showcase",
    description: "Preview core design tokens and UI components under the active theme.",
    component: ThemeShowcaseExample,
    category: "design",
  },
];

if (examples.length === 0) {
  throw new Error("No examples are configured for the preview app.");
}

/**
 * Get the initial example ID from URL search params
 */
function getInitialExampleId(): string {
  if (typeof window === "undefined") {
    return examples[0].id;
  }

  const params = new URLSearchParams(window.location.search);
  const exampleId = params.get("example");

  if (exampleId && examples.some((ex) => ex.id === exampleId)) {
    return exampleId;
  }

  return examples[0].id;
}

/**
 * Renders the preview shell with example selection controls.
 */
export function ExamplePreviewApp(): React.ReactElement {
  const themeOptions = React.useMemo(() => listAvailableThemes(), []);
  const [selectedThemeId, setSelectedThemeId] = React.useState<NodeEditorThemeId>(
    () => getStoredThemeId() ?? "default",
  );

  const [selectedExampleId, setSelectedExampleId] = React.useState(getInitialExampleId);

  const selectedExample = React.useMemo(
    () => examples.find((example) => example.id === selectedExampleId) ?? examples[0],
    [selectedExampleId],
  );

  const handleExampleChange = React.useCallback((newExampleId: string) => {
    setSelectedExampleId(newExampleId);

    // Update URL search params
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("example", newExampleId);
      window.history.pushState({}, "", url);
    }
  }, []);

  // Handle browser back/forward buttons
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handlePopState = () => {
      const newExampleId = getInitialExampleId();
      setSelectedExampleId(newExampleId);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const ExampleComponent = selectedExample.component;

  React.useEffect(() => {
    applyTheme(selectedThemeId);
  }, [selectedThemeId]);

  const groupedExamples = React.useMemo(() => {
    const groups: Record<string, ExampleEntry[]> = {
      basic: [],
      advanced: [],
      layout: [],
      design: [],
    };

    for (const example of examples) {
      groups[example.category].push(example);
    }

    return groups;
  }, []);

  const categoryLabels: Record<string, string> = {
    basic: "Basic Examples",
    advanced: "Advanced Examples",
    layout: "Layout Examples",
    design: "Design Examples",
  };

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <div className={classes.headerContent}>
          <h1 className={classes.title}>Node Editor Examples - {selectedExample.title}</h1>
          <span className={classes.description}>{selectedExample.description}</span>
        </div>
        <div className={classes.controls}>
          <select
            aria-label="Select theme"
            value={selectedThemeId}
            onChange={(event) => setSelectedThemeId(event.target.value as NodeEditorThemeId)}
            className={classes.select}
          >
            {themeOptions.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Select example"
            value={selectedExampleId}
            onChange={(event) => handleExampleChange(event.target.value)}
            className={classes.select}
          >
            {Object.entries(groupedExamples).map(([category, categoryExamples]) => (
              <optgroup key={category} label={categoryLabels[category]}>
                {categoryExamples.map((example) => (
                  <option key={example.id} value={example.id}>
                    {example.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </header>
      <main className={classes.main} key={selectedExample.id}>
        <ExampleComponent />
      </main>
    </div>
  );
}
