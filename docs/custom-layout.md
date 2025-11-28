# Custom Layout Guide

This guide explains how to create custom layouts for the NodeEditor component. There are two primary approaches depending on your level of customization needs.

## Overview

| Approach                 | Components                                 | Freedom | Use Case                                      |
| ------------------------ | ------------------------------------------ | ------- | --------------------------------------------- |
| **Full Custom**          | `NodeEditorCore` + `NodeEditorCanvas`      | Maximum | Flexbox, custom CSS, entirely custom UI       |
| **GridLayout Extension** | `NodeEditor` + `gridConfig` + `gridLayers` | High    | Standard customization with built-in features |

## Approach 1: Full Custom Layout (NodeEditorCore)

Use this approach when you need complete control over the layout without depending on the built-in GridLayout system.

### Core Exports

Import from the core module to avoid pulling in panel implementations:

```typescript
import { NodeEditorCore, NodeEditorCanvas, type NodeEditorData } from "react-wireflow/core";
import { NodeCanvas } from "react-wireflow";
```

### Basic Structure

```tsx
import { NodeEditorCore, NodeEditorCanvas } from "react-wireflow/core";
import { NodeCanvas } from "react-wireflow";

function CustomEditor() {
  const [data, setData] = useState<NodeEditorData>();

  return (
    <div className="my-custom-container">
      <NodeEditorCore
        initialData={initialData}
        onDataChange={setData}
        nodeDefinitions={myNodeDefinitions}
        includeDefaultDefinitions={false}
      >
        {/* Custom sidebar - any component */}
        <aside className="my-sidebar">
          <h3>Node Palette</h3>
          {/* Your custom palette UI */}
        </aside>

        {/* Canvas area - required */}
        <main className="my-canvas-area">
          <NodeEditorCanvas>
            <NodeCanvas />
          </NodeEditorCanvas>
        </main>

        {/* Custom inspector - any component */}
        <aside className="my-inspector">
          <h3>Inspector</h3>
          {/* Your custom inspector UI */}
        </aside>
      </NodeEditorCore>
    </div>
  );
}
```

### NodeEditorCore Props

| Prop                        | Type                             | Description                                    |
| --------------------------- | -------------------------------- | ---------------------------------------------- |
| `initialData`               | `Partial<NodeEditorData>`        | Initial editor state (uncontrolled)            |
| `data`                      | `NodeEditorData`                 | Controlled editor state                        |
| `onDataChange`              | `(data: NodeEditorData) => void` | Callback when data changes                     |
| `nodeDefinitions`           | `NodeDefinition[]`               | Custom node type definitions                   |
| `includeDefaultDefinitions` | `boolean`                        | Include built-in node types (default: `true`)  |
| `autoSaveEnabled`           | `boolean`                        | Enable/disable auto-save                       |
| `renderers`                 | `NodeEditorRendererOverrides`    | Custom renderers for nodes, ports, connections |
| `children`                  | `ReactNode`                      | Your custom layout content                     |

### NodeEditorCanvas Props

| Prop                   | Type                   | Description                                 |
| ---------------------- | ---------------------- | ------------------------------------------- |
| `portPositionBehavior` | `PortPositionBehavior` | Custom port position calculation            |
| `settingsManager`      | `SettingsManager`      | Settings manager instance                   |
| `children`             | `ReactNode`            | Canvas content (typically `<NodeCanvas />`) |

### Example: Flexbox Layout

```tsx
// styles.module.css
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  height: 48px;
  background: var(--header-bg);
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  border-right: 1px solid var(--border);
}

.canvas {
  flex: 1;
  position: relative;
}

.inspector {
  width: 320px;
  border-left: 1px solid var(--border);
}
```

```tsx
import styles from "./styles.module.css";

function FlexboxEditor() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>My Editor</header>

      <div className={styles.main}>
        <NodeEditorCore initialData={data} nodeDefinitions={definitions}>
          <aside className={styles.sidebar}>{/* Sidebar content */}</aside>

          <div className={styles.canvas}>
            <NodeEditorCanvas>
              <NodeCanvas />
            </NodeEditorCanvas>
          </div>

          <aside className={styles.inspector}>{/* Inspector content */}</aside>
        </NodeEditorCore>
      </div>
    </div>
  );
}
```

## Approach 2: GridLayout Extension

Use the built-in GridLayout system for standard customization with features like resizable panels, floating layers, and drawers.

### Basic Usage

```tsx
import { NodeEditor, InspectorPanel, type GridLayoutConfig, type LayerDefinition } from "react-wireflow";
import { NodeCanvas } from "react-wireflow";

function GridEditor() {
  const gridConfig: GridLayoutConfig = {
    areas: [
      ["sidebar", "canvas", "inspector"],
      ["statusbar", "statusbar", "statusbar"],
    ],
    rows: [{ size: "1fr" }, { size: "auto" }],
    columns: [
      { size: "200px", resizable: true, minSize: 150, maxSize: 400 },
      { size: "1fr" },
      { size: "300px", resizable: true, minSize: 200, maxSize: 500 },
    ],
    gap: "0",
  };

  const gridLayers: LayerDefinition[] = [
    {
      id: "sidebar",
      component: <MySidebar />,
      gridArea: "sidebar",
      zIndex: 1,
    },
    {
      id: "canvas",
      component: <NodeCanvas />,
      gridArea: "canvas",
      zIndex: 0,
    },
    {
      id: "inspector",
      component: <InspectorPanel />,
      gridArea: "inspector",
      zIndex: 1,
    },
    {
      id: "statusbar",
      component: <MyStatusBar />,
      gridArea: "statusbar",
      zIndex: 1,
    },
  ];

  return (
    <NodeEditor
      gridConfig={gridConfig}
      gridLayers={gridLayers}
      initialData={initialData}
      nodeDefinitions={nodeDefinitions}
    />
  );
}
```

## Type Definitions

### GridLayoutConfig

Defines the CSS Grid structure for the editor.

```typescript
type GridLayoutConfig = {
  /** Grid template areas as 2D array */
  areas: string[][];
  /** Row track definitions */
  rows: GridTrack[];
  /** Column track definitions */
  columns: GridTrack[];
  /** CSS gap between cells */
  gap?: string;
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
};
```

### GridTrack

Defines a single row or column track.

```typescript
type GridTrack = {
  /** Track size: "1fr", "300px", "auto", etc. */
  size: string;
  /** Whether this track can be resized by the user */
  resizable?: boolean;
  /** Minimum size in pixels (when resizable) */
  minSize?: number;
  /** Maximum size in pixels (when resizable) */
  maxSize?: number;
};
```

### LayerDefinition

Defines a single layer within the grid layout.

```typescript
type LayerDefinition = {
  /** Unique identifier */
  id: string;
  /** React component to render */
  component: React.ReactNode;
  /** Whether the layer is visible */
  visible?: boolean;

  // Grid positioning (positionMode: "grid" or default)
  /** CSS grid-area name */
  gridArea?: string;
  /** CSS grid-row value */
  gridRow?: string;
  /** CSS grid-column value */
  gridColumn?: string;

  // Absolute/Fixed/Relative positioning
  /** Positioning mode: "grid" | "absolute" | "relative" | "fixed" */
  positionMode?: LayerPositionMode;
  /** Position coordinates (for non-grid modes) */
  position?: {
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
  };

  // Dimensions and stacking
  /** Z-index for layer ordering */
  zIndex?: number;
  /** Width (CSS value or pixels) */
  width?: string | number;
  /** Height (CSS value or pixels) */
  height?: string | number;

  // Interactivity
  /** Pointer events behavior */
  pointerEvents?: boolean | "auto" | "none";
  /** Enable dragging for floating panels */
  draggable?: boolean;
  /** Callback when position changes (draggable layers) */
  onPositionChange?: (position: { x: number; y: number }) => void;
  /** Drawer behavior for mobile slide-in panels */
  drawer?: DrawerBehavior;

  // Styling
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
};
```

### DrawerBehavior

Configuration for mobile-friendly drawer panels.

```typescript
type DrawerBehavior = {
  /** Slide-in direction */
  placement: "top" | "right" | "bottom" | "left";
  /** Initial open state */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Allow dismissing by clicking outside */
  dismissible?: boolean;
  /** Show backdrop overlay */
  showBackdrop?: boolean;
  /** Backdrop opacity (0-1) */
  backdropOpacity?: number;
  /** Drawer size when open (pixels or percentage) */
  size?: string | number;
  /** Callback when state changes */
  onStateChange?: (open: boolean) => void;
  /** Header configuration */
  header?: {
    title?: string;
    showCloseButton?: boolean;
  };
};
```

## Common Patterns

### Floating Panels

Create draggable floating panels using absolute positioning:

```typescript
const gridLayers: LayerDefinition[] = [
  {
    id: "canvas",
    component: <NodeCanvas />,
    gridArea: "canvas",
    zIndex: 0,
  },
  {
    id: "floating-inspector",
    component: <InspectorPanel />,
    positionMode: "absolute",
    position: { right: 20, top: 20 },
    width: 320,
    height: 480,
    zIndex: 100,
    draggable: true,
    pointerEvents: "auto",
    onPositionChange: (pos) => {
      console.log("Inspector moved to:", pos);
    },
  },
];
```

### Fixed Toolbar

Create a viewport-fixed toolbar:

```typescript
{
  id: "toolbar",
  component: <MyToolbar />,
  positionMode: "fixed",
  position: {
    bottom: 20,
    left: "50%",
  },
  style: {
    transform: "translateX(-50%)",
  },
  zIndex: 200,
}
```

### Minimap Overlay

Add a draggable minimap:

```typescript
{
  id: "minimap",
  component: <Minimap width={200} height={150} />,
  positionMode: "absolute",
  position: { right: 10, bottom: 10 },
  width: 200,
  height: 150,
  zIndex: 20,
  draggable: true,
}
```

### Mobile Drawer

Convert a panel to a mobile-friendly drawer:

```typescript
{
  id: "inspector",
  component: <InspectorPanel />,
  drawer: {
    placement: "bottom",
    defaultOpen: false,
    dismissible: true,
    showBackdrop: true,
    backdropOpacity: 0.4,
    size: "70%",
    header: {
      title: "Inspector",
      showCloseButton: true,
    },
    onStateChange: (open) => {
      setInspectorOpen(open);
    },
  },
}
```

### Responsive Layout

Switch layouts based on viewport width:

```tsx
function ResponsiveEditor() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const gridConfig = useMemo(() => {
    if (isMobile) {
      return {
        areas: [["canvas"]],
        rows: [{ size: "1fr" }],
        columns: [{ size: "1fr" }],
      };
    }
    return {
      areas: [["canvas", "inspector"]],
      rows: [{ size: "1fr" }],
      columns: [{ size: "1fr" }, { size: "320px", resizable: true }],
    };
  }, [isMobile]);

  const gridLayers = useMemo(() => {
    const layers: LayerDefinition[] = [
      {
        id: "canvas",
        component: <NodeCanvas />,
        gridArea: "canvas",
        zIndex: 0,
      },
    ];

    if (isMobile) {
      layers.push({
        id: "inspector",
        component: <InspectorPanel />,
        drawer: {
          placement: "bottom",
          size: "70%",
          dismissible: true,
          showBackdrop: true,
        },
      });
    } else if (isTablet) {
      layers.push({
        id: "inspector",
        component: <InspectorPanel />,
        positionMode: "absolute",
        position: { right: 0, top: 0 },
        width: 300,
        draggable: true,
        zIndex: 50,
      });
    } else {
      layers.push({
        id: "inspector",
        component: <InspectorPanel />,
        gridArea: "inspector",
        zIndex: 1,
      });
    }

    return layers;
  }, [isMobile, isTablet]);

  return (
    <NodeEditor gridConfig={gridConfig} gridLayers={gridLayers} initialData={data} nodeDefinitions={definitions} />
  );
}
```

## Default Configuration

The default layout configuration is available for reference or extension:

```typescript
import { defaultEditorGridConfig, defaultEditorGridLayers } from "react-wireflow";

// Default config structure:
// - Canvas on left (1fr)
// - Inspector on right (300px, resizable 200-600px)
// - Statusbar spanning bottom
```

## Choosing an Approach

| Requirement                            | Recommended Approach             |
| -------------------------------------- | -------------------------------- |
| Complete UI freedom                    | Full Custom (`NodeEditorCore`)   |
| Standard 2-3 column layout             | GridLayout Extension             |
| Floating/draggable panels              | GridLayout Extension             |
| Mobile drawer support                  | GridLayout Extension             |
| Resizable panel dividers               | GridLayout Extension             |
| Integration with existing UI framework | Full Custom (`NodeEditorCore`)   |
| Minimal bundle size                    | Full Custom (import from `core`) |

## Related Files

- `src/NodeEditorCore.tsx` - Core provider component
- `src/components/canvas/NodeEditorCanvas.tsx` - Canvas wrapper component
- `src/types/panels.tsx` - Type definitions
- `src/config/defaultLayout.tsx` - Default configuration
- `src/examples/demos/custom-layout-demo.tsx` - Full custom example
- `src/examples/demos/AdvancedLayoutExample.tsx` - GridLayout example
