# Settings Manager Guide

This guide explains how to use `SettingsManager` to configure and persist editor settings.

## Overview

`SettingsManager` provides a centralized system for managing editor settings, including:

- UI appearance settings (theme, grid, fonts)
- Behavior settings (node search view mode, animations)
- Performance settings (history steps, optimization)
- Keyboard shortcuts

## Basic Usage

### Creating a SettingsManager

```typescript
import { SettingsManager } from "react-wireflow/core";

const settingsManager = new SettingsManager();
```

### Setting Values

```typescript
// Set individual settings
settingsManager.setValue("behavior.nodeSearchViewMode", "split");
settingsManager.setValue("appearance.theme", "dark");
settingsManager.setValue("appearance.showGrid", true);
```

### Getting Values

```typescript
const viewMode = settingsManager.getValue<string>("behavior.nodeSearchViewMode");
const theme = settingsManager.getValue<string>("appearance.theme");
```

## Integration with NodeEditorCanvas

Pass the `settingsManager` to `NodeEditorCanvas` to apply settings:

```tsx
import * as React from "react";
import { NodeEditorCore, NodeEditorCanvas, SettingsManager } from "react-wireflow/core";
import { NodeCanvas } from "react-wireflow";

function MyEditor() {
  const settingsManager = React.useMemo(() => {
    const settings = new SettingsManager();
    settings.setValue("behavior.nodeSearchViewMode", "split");
    return settings;
  }, []);

  return (
    <NodeEditorCore initialData={data} nodeDefinitions={definitions}>
      <NodeEditorCanvas settingsManager={settingsManager}>
        <NodeCanvas />
      </NodeEditorCanvas>
    </NodeEditorCore>
  );
}
```

## Available Settings

### Behavior Settings

| Key                             | Type                  | Default  | Description                      |
| ------------------------------- | --------------------- | -------- | -------------------------------- |
| `behavior.nodeSearchViewMode`   | `"list"` \| `"split"` | `"list"` | Node search menu display mode    |
| `behavior.doubleClickToEdit`    | `boolean`             | `true`   | Double click nodes to edit       |
| `behavior.autoConnect`          | `boolean`             | `true`   | Auto-connect compatible ports    |
| `behavior.smoothAnimations`     | `boolean`             | `true`   | Enable smooth transitions        |
| `behavior.dragThreshold`        | `number`              | `5`      | Minimum drag distance (pixels)   |
| `behavior.connectionStyle`      | `string`              | `curved` | Connection line style            |
| `behavior.selectionMode`        | `string`              | `click`  | Selection mode                   |
| `behavior.wheelZoomSensitivity` | `number`              | `1`      | Mouse wheel zoom sensitivity     |

### Appearance Settings

| Key                          | Type      | Default     | Description              |
| ---------------------------- | --------- | ----------- | ------------------------ |
| `appearance.theme`           | `string`  | `"light"`   | Visual theme             |
| `appearance.fontSize`        | `number`  | `14`        | Base font size (pixels)  |
| `appearance.fontFamily`      | `string`  | `"system"`  | Font family              |
| `appearance.showGrid`        | `boolean` | `true`      | Display grid lines       |
| `appearance.gridSize`        | `number`  | `20`        | Grid size (pixels)       |
| `appearance.gridOpacity`     | `number`  | `0.3`       | Grid opacity (0-1)       |
| `appearance.snapToGrid`      | `boolean` | `false`     | Snap nodes to grid       |
| `appearance.showMinimap`     | `boolean` | `true`      | Display minimap          |
| `appearance.showStatusBar`   | `boolean` | `true`      | Display status bar       |
| `appearance.showToolbar`     | `boolean` | `true`      | Display toolbar          |
| `appearance.canvasBackground`| `string`  | `"#ffffff"` | Canvas background color  |

### General Settings

| Key                           | Type      | Default | Description                     |
| ----------------------------- | --------- | ------- | ------------------------------- |
| `general.language`            | `string`  | `"en"`  | Interface language              |
| `general.autoSave`            | `boolean` | `true`  | Enable auto-save                |
| `general.autoSaveInterval`    | `number`  | `30`    | Auto-save interval (seconds)    |
| `general.confirmBeforeExit`   | `boolean` | `true`  | Confirm before closing          |

### Performance Settings

| Key                              | Type      | Default | Description                      |
| -------------------------------- | --------- | ------- | -------------------------------- |
| `performance.maxHistorySteps`    | `number`  | `50`    | Maximum undo/redo steps          |
| `performance.renderOptimization` | `boolean` | `true`  | Enable render optimization       |
| `performance.lazyLoading`        | `boolean` | `true`  | Lazy load nodes                  |
| `performance.virtualScrolling`   | `boolean` | `true`  | Use virtual scrolling            |
| `performance.maxVisibleNodes`    | `number`  | `1000`  | Max nodes to render              |

## Node Search View Modes

The `behavior.nodeSearchViewMode` setting controls how the node creation menu is displayed:

### List Mode (Default)

```typescript
settingsManager.setValue("behavior.nodeSearchViewMode", "list");
```

A compact vertical list showing all available nodes with search filtering.

### Split Mode

```typescript
settingsManager.setValue("behavior.nodeSearchViewMode", "split");
```

A split-pane view with:
- Left pane: Category tree navigation
- Right pane: Node list for selected category

This mode is recommended when you have many node types organized into nested categories.

## Listening for Changes

Subscribe to setting changes:

```typescript
const unsubscribe = settingsManager.on("change", (event) => {
  console.log(`Setting ${event.key} changed from ${event.previousValue} to ${event.value}`);
});

// Clean up when done
unsubscribe();
```

## Persistence

By default, settings are persisted to `localStorage`. Settings are automatically saved when changed and loaded on initialization.

### Custom Storage

You can provide a custom storage implementation:

```typescript
import { SettingsManager, LocalSettingsStorage } from "react-wireflow/core";

// Custom prefix for localStorage keys
const storage = new LocalSettingsStorage("my-app-settings");
const settingsManager = new SettingsManager(storage);
```

## Using with useSettings Hook

The `useSettings` hook provides reactive access to settings:

```typescript
import { useSettings } from "react-wireflow";

function MyComponent({ settingsManager }) {
  const settings = useSettings(settingsManager);

  return (
    <div>
      <p>View Mode: {settings.nodeSearchViewMode}</p>
      <p>Theme: {settings.theme}</p>
      <p>Show Grid: {settings.showGrid ? "Yes" : "No"}</p>
    </div>
  );
}
```

The hook automatically re-renders when settings change.

## Registering Custom Settings

You can register custom settings for your application:

```typescript
settingsManager.registerSetting({
  key: "custom.myFeature",
  label: "My Feature",
  description: "Enable my custom feature",
  category: "custom",
  type: "boolean",
  defaultValue: false,
});

// Now use it
settingsManager.setValue("custom.myFeature", true);
```

## Export and Import

Export settings for backup or sharing:

```typescript
const exported = settingsManager.export();
// Returns JSON string with all settings
```

Import settings:

```typescript
settingsManager.import(jsonString);
```

## Reset to Defaults

Reset specific settings:

```typescript
settingsManager.resetToDefaults(["appearance.theme", "appearance.fontSize"]);
```

Reset all settings:

```typescript
settingsManager.resetToDefaults();
```

## Related Files

- `src/settings/SettingsManager.ts` - Core implementation
- `src/settings/types.ts` - Type definitions
- `src/settings/defaultSettings.ts` - Default setting definitions
- `src/hooks/useSettings.ts` - React hook for settings
- `src/examples/demos/layout/custom-core/custom-layout-demo.tsx` - Usage example
