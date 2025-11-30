/**
 * @file Shell UI that lets developers switch between example scenarios
 */
import * as React from "react";

import { applyTheme, getStoredThemeId, listAvailableThemes } from "./themes/registry";
import type { NodeEditorThemeId } from "./themes/registry";
import { ConstrainedNodeExample } from "./demos/basic/constrained-nodes/ConstrainedNodeExample";
import { TypedNodesExample } from "./demos/basic/typed-nodes/TypedNodesExample";
import { AdvancedNodeExample } from "./demos/advanced/advanced-node/AdvancedNodeExample";
import { CustomPortRendererExample } from "./demos/custom/ports/port-playground/CustomPortRendererExample";
import { I18nPlaygroundExample } from "./demos/advanced/internationalization/i18n-playground/I18nPlaygroundExample";
import {
  DefaultLayoutExample,
  CustomInspectorWidthExample,
  CanvasOnlyExample,
  WithToolbarExample,
} from "./demos/layout/column/ColumnLayoutExample";
import { InspectorPaletteDnDExample } from "./demos/layout/inspector-palette-dnd/InspectorPaletteDnDExample";
import { AdvancedLayoutExample } from "./demos/layout/advanced/AdvancedLayoutExample";
import { ResponsiveLayoutExample } from "./demos/layout/responsive/ResponsiveLayoutExample";
import { MobileDrawerExample } from "./demos/layout/mobile-drawer/MobileDrawerExample";
import { ThreeJsExample } from "./demos/advanced/integrations/threejs/ThreeJsExample";
import CustomNodeExample from "./demos/custom/nodes/custom-node/CustomNodeExample";
import { ThemeShowcaseExample } from "./demos/design/theme-showcase/ThemeShowcaseExample";
import { AdvancedNestedEditorExample } from "./demos/advanced/nested-editors/advanced-nested-editor/AdvancedNestedEditorExample";
import { InteractionCustomizationExample } from "./demos/advanced/interaction/customization/InteractionCustomizationExample";
import { CustomConnectorExample } from "./demos/custom/connections/custom-connector/CustomConnectorExample";
import { OpalThemeExample } from "./demos/design/themes/opal/OpalThemeExample";
import { UnityThemeExample } from "./demos/design/themes/unity/UnityThemeExample";
import { AdobeThemeExample } from "./demos/design/themes/adobe/AdobeThemeExample";
import { FigmaThemeExample } from "./demos/design/themes/figma/FigmaThemeExample";
import { TradingAnalyticsDashboard } from "./demos/advanced/analytics/trading-analytics/TradingAnalyticsDashboard";
import { DataBindingModesExample } from "./demos/data/binding-modes/DataBindingModesExample";
import { ErrorNodeFallbackExample } from "./demos/basic/error-node-fallback/ErrorNodeFallbackExample";
import { CustomLayoutDemo } from "./demos/layout/custom-core/custom-layout-demo";
import { DynamicPortPlaygroundExample } from "./demos/custom/ports/port-playground/DynamicPortPlaygroundExample";
import { ComfyUILayoutExample } from "./demos/custom/layouts/comfyui/ComfyUILayoutExample";
import { CustomInspectorExample } from "./demos/custom/inspector/custom-inspector/CustomInspectorExample";
import { NodeSearchMenuExample } from "./demos/custom/search/node-search-menu/NodeSearchMenuExample";
import classes from "./ExamplePreviewApp.module.css";

type ExampleEntry = {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
  category: "basic" | "advanced" | "custom" | "layout" | "design" | "data";
};

const examples: ExampleEntry[] = [
  {
    id: "trading-analytics-dashboard",
    title: "Trading Analytics Dashboard",
    description:
      "Financial analytics dashboard showing trading strategies, execution metrics, and portfolio performance.",
    component: TradingAnalyticsDashboard,
    category: "advanced",
  },
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
    id: "interaction-customization",
    title: "Interaction Customization",
    description: "Experiment with mobile-friendly panning, pinch zoom, and configurable keyboard shortcuts.",
    component: InteractionCustomizationExample,
    category: "advanced",
  },
  {
    id: "custom-node",
    title: "Custom Nodes with External Data",
    description: "Shows how to connect custom renderers to external data sources.",
    component: CustomNodeExample,
    category: "custom",
  },
  {
    id: "typed-nodes",
    title: "Typed Node Definitions",
    description: "Demonstrates strongly-typed node definitions with custom renderers.",
    component: TypedNodesExample,
    category: "basic",
  },
  {
    id: "data-binding-modes",
    title: "Data Binding Modes",
    description: "Side-by-side uncontrolled vs controlled NodeEditor usage, mirroring React input semantics.",
    component: DataBindingModesExample,
    category: "data",
  },
  {
    id: "constrained-nodes",
    title: "Constrained Node Definitions",
    description: "Highlights constraint helpers for placement and connection rules.",
    component: ConstrainedNodeExample,
    category: "basic",
  },
  {
    id: "error-node-fallback",
    title: "Error Node Fallback",
    description: "Shows how unknown node types are displayed as error nodes when fallbackDefinition is enabled.",
    component: ErrorNodeFallbackExample,
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
    id: "advanced-nested-editors",
    title: "Advanced Nested Editors",
    description: "Open floating sub-editors per node with live minimap previews.",
    component: AdvancedNestedEditorExample,
    category: "advanced",
  },
  {
    id: "custom-port-renderer",
    title: "Custom Port Renderer",
    description: "Customize port and connection appearance with custom renderers.",
    component: CustomPortRendererExample,
    category: "custom",
  },
  {
    id: "dynamic-port-playground",
    title: "Dynamic Port Playground",
    description: "Experiment with segmented port placement, multi-type validation, and dynamic port counts.",
    component: DynamicPortPlaygroundExample,
    category: "custom",
  },
  {
    id: "comfyui-layout",
    title: "ComfyUI-Style Port Layout",
    description: "Region-based port placement with header/body areas, similar to ComfyUI's node layout.",
    component: ComfyUILayoutExample,
    category: "custom",
  },
  {
    id: "custom-connector-renderer",
    title: "Custom Connector Playground",
    description: "Render bezier connectors with live handle overlays and animated accents.",
    component: CustomConnectorExample,
    category: "custom",
  },
  {
    id: "custom-inspector",
    title: "Custom Inspector Panels",
    description: "Demonstrates custom inspector tabs, settings panels, and per-node renderInspector functions.",
    component: CustomInspectorExample,
    category: "custom",
  },
  {
    id: "node-search-menu",
    title: "Node Search Menu (Split Pane)",
    description: "split pane view with nested category tree for node creation menu.",
    component: NodeSearchMenuExample,
    category: "custom",
  },
  {
    id: "layout-custom-core",
    title: "Layout: Custom Core (Flexbox)",
    description: "Custom layout using NodeEditorCore and NodeEditorCanvas without GridLayout dependency.",
    component: CustomLayoutDemo,
    category: "layout",
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
    id: "layout-inspector-palette-dnd",
    title: "Layout: Inspector Drag & Drop",
    description: "Use the floating Node Library panel to drag templates directly onto the canvas.",
    component: InspectorPaletteDnDExample,
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
    id: "layout-responsive",
    title: "Layout: Responsive (Mobile/Tablet/Desktop)",
    description: "Dynamically switches between mobile, tablet, and desktop layouts based on viewport size.",
    component: ResponsiveLayoutExample,
    category: "layout",
  },
  {
    id: "layout-mobile-drawer",
    title: "Layout: Mobile Drawer",
    description: "Mobile-friendly layout with drawer-based inspector panel for touch devices.",
    component: MobileDrawerExample,
    category: "layout",
  },
  {
    id: "design-theme-showcase",
    title: "Design: Theme Showcase",
    description: "Preview core design tokens and UI components under the active theme.",
    component: ThemeShowcaseExample,
    category: "design",
  },
  {
    id: "design-opal-theme",
    title: "Design: Opal Theme",
    description: "Soft pastel aesthetic with custom connection and port renderers inspired by Opal AI.",
    component: OpalThemeExample,
    category: "design",
  },
  {
    id: "design-unity-theme",
    title: "Design: Unity Theme",
    description: "Professional dark theme inspired by Unity Editor's interface design.",
    component: UnityThemeExample,
    category: "design",
  },
  {
    id: "design-adobe-theme",
    title: "Design: Adobe Theme",
    description: "Sleek dark interface inspired by Adobe Creative Cloud applications.",
    component: AdobeThemeExample,
    category: "design",
  },
  {
    id: "design-figma-theme",
    title: "Design: Figma Theme",
    description: "Clean light interface with Figma's signature blue and minimal design language.",
    component: FigmaThemeExample,
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
      custom: [],
      data: [],
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
    custom: "Custom Renderer Examples",
    data: "Data Binding Examples",
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
