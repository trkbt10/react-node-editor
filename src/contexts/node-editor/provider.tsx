/**
 * @file Node editor provider
 * Provides the node editor context with state management, actions, and utility functions
 * Supports both controlled and uncontrolled modes with auto-save capabilities
 */
import * as React from "react";
import type { NodeEditorData, NodeId, Port } from "../../types/core";
import { useSettings } from "../../hooks/useSettings";
import type { SettingsManager } from "../../settings/SettingsManager";
import type { SettingValue } from "../../settings/types";
import { createCachedPortResolver } from "../node-ports/utils/portLookup";
import { NodeDefinitionContext } from "../node-definitions/context";
import { bindActionCreators } from "../../utils/typedActions";
import { nodeEditorActions, type NodeEditorAction } from "./actions";
import { nodeEditorReducer, defaultNodeEditorData } from "./reducer";
import { NodeEditorContext } from "./context";
import { snapToGrid } from "./utils/gridSnap";
import { findContainingGroup, getGroupChildren, isNodeInsideGroup } from "./utils/groupOperations";

export type NodeEditorProviderProps = {
  children: React.ReactNode;
  initialState?: Partial<NodeEditorData>;
  controlledData?: NodeEditorData;
  onDataChange?: (data: NodeEditorData) => void;
  onSave?: (data: NodeEditorData) => void | Promise<void>;
  onLoad?: () => NodeEditorData | Promise<NodeEditorData>;
  settingsManager?: SettingsManager;
  /** Enable/disable auto-save (overrides settings) */
  autoSaveEnabled?: boolean;
  /** Auto-save interval in seconds (overrides settings) */
  autoSaveInterval?: number;
};

export const NodeEditorProvider: React.FC<NodeEditorProviderProps> = ({
  children,
  initialState,
  controlledData,
  onDataChange,
  onLoad,
  onSave,
  settingsManager,
  autoSaveEnabled,
  autoSaveInterval,
}) => {
  const { registry } = React.useContext(NodeDefinitionContext);
  const portResolver = React.useMemo(() => createCachedPortResolver(), []);

  const initialData: NodeEditorData = React.useMemo(() => {
    return {
      nodes: initialState?.nodes || defaultNodeEditorData.nodes,
      connections: initialState?.connections || defaultNodeEditorData.connections,
    };
  }, [initialState]);

  const nodeDefinitions = React.useMemo(() => registry.getAll(), [registry]);

  const reducerWithDefinitions = React.useCallback(
    (state: NodeEditorData, action: NodeEditorAction) => nodeEditorReducer(state, action, nodeDefinitions),
    [nodeDefinitions],
  );

  const [internalState, internalDispatch] = React.useReducer(reducerWithDefinitions, initialData);
  const state = controlledData || internalState;
  // Keep latest state and IO handlers in refs to avoid unstable callbacks/effects
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const onDataChangeRef = React.useRef(onDataChange);
  onDataChangeRef.current = onDataChange;
  const onSaveRef = React.useRef(onSave);
  onSaveRef.current = onSave;
  const onLoadRef = React.useRef(onLoad);
  onLoadRef.current = onLoad;
  const nodeDefinitionsRef = React.useRef(nodeDefinitions);
  nodeDefinitionsRef.current = nodeDefinitions;

  // Stable dispatch that doesn't recreate per state change to reduce re-renders
  const dispatch: React.Dispatch<NodeEditorAction> = React.useCallback(
    (action: NodeEditorAction) => {
      if (controlledData) {
        const newState = nodeEditorReducer(stateRef.current, action, nodeDefinitionsRef.current);
        onDataChangeRef.current?.(newState);
        return;
      }
      // Uncontrolled: dispatch internally and notify external listener with computed next state
      const nextState = nodeEditorReducer(stateRef.current, action, nodeDefinitionsRef.current);
      internalDispatch(action);
      onDataChangeRef.current?.(nextState);
    },
    [controlledData],
  );

  const boundActions = React.useMemo(() => bindActionCreators(nodeEditorActions, dispatch), [dispatch]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const isSavingRef = React.useRef(false);
  React.useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  const settings = useSettings(settingsManager);
  const { autoSave: settingsAutoSave, autoSaveInterval: settingsAutoSaveInterval } = settings;
  const effectiveAutoSave = autoSaveEnabled ?? settingsAutoSave;
  const effectiveAutoSaveInterval = autoSaveInterval ?? settingsAutoSaveInterval ?? 30;

  // Load once when registry is available; avoid effect-driven loops
  const hasLoadedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }
    if (!onLoadRef.current) {
      return;
    }
    // Wait until registry is available when we need it for migration/ports
    if (!registry) {
      return;
    }
    hasLoadedRef.current = true;
    setIsLoading(true);
    Promise.resolve(onLoadRef.current())
      .then((data) => {
        boundActions.setNodeData(data);
      })
      .catch((error) => {
        console.error("Failed to load node editor data:", error);
      })
      .finally(() => setIsLoading(false));
  }, [registry, boundActions]);

  // Notification for onDataChange is handled inside dispatch (both modes)
  // Additionally, fire a single initial notification in uncontrolled mode
  React.useEffect(() => {
    if (controlledData) {
      return;
    }
    onDataChangeRef.current?.(stateRef.current);
  }, []);
  // Stable save handler using refs to avoid re-creating on state changes
  const handleSave = React.useCallback(async () => {
    const save = onSaveRef.current;
    if (!save) {
      return;
    }
    if (isSavingRef.current) {
      return;
    }
    try {
      setIsSaving(true);
      isSavingRef.current = true;
      const dataToSave = stateRef.current;
      await Promise.resolve(save(dataToSave));
    } catch (error) {
      console.error("Failed to save node editor data:", error);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, []);

  React.useEffect(() => {
    if (!effectiveAutoSave || !onSaveRef.current) {
      return;
    }
    const intervalId = setInterval(() => {
      // handleSave already checks saving state via ref
      handleSave();
    }, effectiveAutoSaveInterval * 1000);
    return () => clearInterval(intervalId);
  }, [effectiveAutoSave, effectiveAutoSaveInterval, handleSave]);

  const getNodePorts = React.useCallback(
    (nodeId: NodeId): Port[] => {
      const node = state.nodes[nodeId];
      if (!node) {
        return [];
      }
      const definition = registry.get(node.type);
      if (!definition) {
        throw new Error(`No node definition registered for type "${node.type}"`);
      }
      return portResolver.getNodePorts(node, definition);
    },
    [state.nodes, registry, portResolver],
  );

  const portLookupMap = React.useMemo(() => {
    return portResolver.createPortLookupMap(state.nodes, (type: string) => registry.get(type));
  }, [state.nodes, registry, portResolver]);

  React.useEffect(() => {
    portResolver.clearCache();
  }, [state.nodes, portResolver]);

  const updateSetting = React.useCallback(
    (key: string, value: unknown) => {
      if (!settingsManager) {
        return;
      }
      try {
        settingsManager.setValue(key, value as SettingValue);
      } catch (error) {
        console.error(`Failed to update setting ${key}:`, error);
      }
    },
    [settingsManager],
  );

  const utils = React.useMemo(
    () => ({
      snapToGrid,
      findContainingGroup,
      getGroupChildren,
      isNodeInsideGroup,
    }),
    [],
  );

  const contextValue = React.useMemo(
    () => ({
      state,
      dispatch,
      actions: boundActions,
      actionCreators: nodeEditorActions,
      isLoading,
      isSaving,
      handleSave,
      getNodePorts,
      portLookupMap,
      settings,
      settingsManager,
      updateSetting,
      utils,
    }),
    [
      state,
      dispatch,
      boundActions,
      isLoading,
      isSaving,
      handleSave,
      getNodePorts,
      portLookupMap,
      settings,
      settingsManager,
      updateSetting,
      utils,
    ],
  );

  return <NodeEditorContext.Provider value={contextValue}>{children}</NodeEditorContext.Provider>;
};

export type { NodeEditorData };
