/**
 * @file Example showing how to customize interaction behavior and keyboard shortcuts at runtime.
 */
import * as React from "react";
import {
  NodeEditor,
  type GridLayoutConfig,
  type LayerDefinition,
  type NodeEditorInteractionSettingsPatch,
  type NodeEditorShortcutAction,
  type KeyboardShortcutActionBehavior,
  type ContextMenuRequest,
  type CanvasPanActivator,
  toUntypedDefinition,
} from "../../../../../index";
import { NodeCanvas } from "../../../../../components/canvas/NodeCanvas";
import { InspectorPanel } from "../../../../../components/inspector/InspectorPanel";
import type { NodeEditorData } from "../../../../../types/core";
import { defaultInteractionSettings } from "../../../../../contexts/InteractionSettingsContext";
import classes from "./InteractionCustomizationExample.module.css";
import { SettingsPanel } from "./SettingsPanel";
import type { PanOptionsState, PinchOptionsState, ShortcutBindingMap, ShortcutOverrideState } from "./panelTypes";
import { StandardNodeDefinition } from "../../../../../node-definitions";

const demoInitialData: NodeEditorData = {
  nodes: {
    source: {
      id: "source",
      type: "standard",
      position: { x: 120, y: 140 },
      size: { width: 220, height: 140 },
      data: { title: "Source Data", description: "Drag from here to wire other nodes." },
    },
    processor: {
      id: "processor",
      type: "standard",
      position: { x: 460, y: 120 },
      size: { width: 220, height: 160 },
      data: { title: "Processor", description: "Applies transformations to the incoming payload." },
    },
    sink: {
      id: "sink",
      type: "standard",
      position: { x: 780, y: 180 },
      size: { width: 220, height: 140 },
      data: { title: "Sink", description: "Receives processed output." },
    },
  },
  connections: {
    flow1: {
      id: "flow1",
      fromNodeId: "source",
      fromPortId: "output",
      toNodeId: "processor",
      toPortId: "input",
    },
    flow2: {
      id: "flow2",
      fromNodeId: "processor",
      fromPortId: "output",
      toNodeId: "sink",
      toPortId: "input",
    },
  },
};

const DEFAULT_SHORTCUT_BINDINGS: ShortcutBindingMap = (() => {
  const actions = defaultInteractionSettings.keyboardShortcuts.actions;
  const map = {} as ShortcutBindingMap;
  (Object.keys(actions) as NodeEditorShortcutAction[]).forEach((action) => {
    const bindings = actions[action]?.bindings ?? [];
    map[action] = bindings.map((binding) => ({ ...binding }));
  });
  return map;
})();

const gridConfig: GridLayoutConfig = {
  areas: [["settings", "canvas", "inspector"]],
  columns: [{ size: "320px" }, { size: "1fr" }, { size: "320px", resizable: true, minSize: 220, maxSize: 460 }],
  rows: [{ size: "1fr" }],
  gap: "0",
};

const MAX_LOG_ENTRIES = 8;

const formatContextEntry = (request: ContextMenuRequest): string => {
  const { x, y } = request.canvasPosition;
  const target =
    request.target.kind === "canvas"
      ? "Canvas"
      : request.target.kind === "node"
        ? `Node ${request.target.nodeId}`
        : `Connection ${request.target.connectionId}`;
  return `${new Date().toLocaleTimeString()} • ${target} via ${request.pointerType} @ (${Math.round(x)}, ${Math.round(y)})`;
};

export const InteractionCustomizationExample: React.FC = () => {
  const [panOptions, setPanOptions] = React.useState<PanOptionsState>({
    allowMouse: true,
    allowTouch: true,
    allowPen: false,
    requireEmptyTarget: true,
  });
  const [pinchOptions, setPinchOptions] = React.useState<PinchOptionsState>({
    enabled: true,
    pointerTypes: ["touch"],
    minDistance: 16,
  });
  const [contextMenuMode, setContextMenuMode] = React.useState<"default" | "custom">("default");
  const [contextMenuLog, setContextMenuLog] = React.useState<string[]>([]);
  const [keyboardEnabled, setKeyboardEnabled] = React.useState(true);
  const [shortcutOverrides, setShortcutOverrides] = React.useState<ShortcutOverrideState>({});

  const handleShortcutOverrideChange = React.useCallback(
    (action: NodeEditorShortcutAction, behavior: KeyboardShortcutActionBehavior | null) => {
      setShortcutOverrides((prev) => {
        const next = { ...prev };
        if (behavior === null) {
          delete next[action];
        } else {
          next[action] = behavior;
        }
        return next;
      });
    },
    [],
  );

  const handleResetShortcuts = React.useCallback(() => {
    setShortcutOverrides({});
    setKeyboardEnabled(true);
  }, []);

  const handleClearContextMenuLog = React.useCallback(() => {
    setContextMenuLog([]);
  }, []);

  const customContextMenuHandler = React.useCallback((request: ContextMenuRequest) => {
    setContextMenuLog((prev) => {
      const entry = formatContextEntry(request);
      const next = [entry, ...prev];
      if (next.length > MAX_LOG_ENTRIES) {
        next.length = MAX_LOG_ENTRIES;
      }
      return next;
    });
    request.defaultShow();
  }, []);

  const interactionSettings = React.useMemo<NodeEditorInteractionSettingsPatch>(() => {
    const panActivators: CanvasPanActivator[] = [];
    if (panOptions.allowMouse) {
      panActivators.push({
        pointerTypes: ["mouse"] as CanvasPanActivator["pointerTypes"],
        buttons: [1],
      });
    }
    if (panOptions.allowTouch) {
      panActivators.push({
        pointerTypes: ["touch"] as CanvasPanActivator["pointerTypes"],
        buttons: [0],
        requireEmptyTarget: panOptions.requireEmptyTarget,
      });
    }
    if (panOptions.allowPen) {
      panActivators.push({
        pointerTypes: ["pen"] as CanvasPanActivator["pointerTypes"],
        buttons: [0],
        requireEmptyTarget: panOptions.requireEmptyTarget,
      });
    }

    const pointerTypes = Array.from(new Set(pinchOptions.pointerTypes)) as typeof pinchOptions.pointerTypes;

    return {
      canvasPanActivators: panActivators,
      pinchZoom: {
        enabled: pinchOptions.enabled,
        pointerTypes,
        minDistance: pinchOptions.minDistance,
      },
      contextMenu: contextMenuMode === "custom" ? { handleRequest: customContextMenuHandler } : undefined,
      keyboardShortcuts: {
        enabled: keyboardEnabled,
        actions: shortcutOverrides,
      },
    };
  }, [panOptions, pinchOptions, contextMenuMode, customContextMenuHandler, keyboardEnabled, shortcutOverrides]);

  const gridLayers = React.useMemo<LayerDefinition[]>(
    () => [
      {
        id: "settings",
        gridArea: "settings",
        component: (
          <SettingsPanel
            panOptions={panOptions}
            onPanOptionsChange={setPanOptions}
            pinchOptions={pinchOptions}
            onPinchOptionsChange={setPinchOptions}
            contextMenuMode={contextMenuMode}
            onContextMenuModeChange={setContextMenuMode}
            contextMenuLog={contextMenuLog}
            onClearContextMenuLog={handleClearContextMenuLog}
            keyboardEnabled={keyboardEnabled}
            onKeyboardEnabledChange={setKeyboardEnabled}
            shortcutOverrides={shortcutOverrides}
            onShortcutOverrideChange={handleShortcutOverrideChange}
            defaultShortcutBindings={DEFAULT_SHORTCUT_BINDINGS}
            onResetShortcuts={handleResetShortcuts}
          />
        ),
        zIndex: 2,
      },
      {
        id: "canvas",
        gridArea: "canvas",
        component: <NodeCanvas />,
        zIndex: 0,
      },
      {
        id: "inspector",
        gridArea: "inspector",
        component: <InspectorPanel />,
        zIndex: 1,
      },
    ],
    [
      panOptions,
      pinchOptions,
      contextMenuMode,
      contextMenuLog,
      handleClearContextMenuLog,
      keyboardEnabled,
      shortcutOverrides,
      handleShortcutOverrideChange,
      handleResetShortcuts,
    ],
  );

  return (
    <div className={classes.wrapper}>
      <NodeEditor
        initialData={demoInitialData}
        gridConfig={gridConfig}
        gridLayers={gridLayers}
        interactionSettings={interactionSettings}
        nodeDefinitions={[toUntypedDefinition(StandardNodeDefinition)]}
      />
    </div>
  );
};
