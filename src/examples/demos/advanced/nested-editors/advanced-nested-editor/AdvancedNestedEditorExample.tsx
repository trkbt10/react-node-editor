/**
 * @file Advanced example demonstrating nested editors within nodes
 */
import * as React from "react";
import { NodeEditor } from "../../../../../index";
import { NodeCanvas } from "../../../../../components/canvas/NodeCanvas";
import { Minimap } from "../../../../../components/layers/Minimap";
import type { GridLayoutConfig, LayerDefinition } from "../../../../../types/panels";
import type { NodeEditorData } from "../../../../../types/core";
import { asNodeDefinition, type ExternalDataReference, type NodeDefinition } from "../../../../../types/NodeDefinition";
import { StandardNodeDefinition } from "../../../../../node-definitions/standard";
import { SubEditorHostProvider, type SubEditorOpenRequest } from "./SubEditorHostContext";
import { SubEditorNodeDefinition } from "./SubEditorNode";
import { SubEditorWindow } from "./SubEditorWindow";
import { advancedNestedInitialData, createDefaultSubEditorData } from "./initialData";
import { createSubEditorRefId, ensureSubEditorData } from "./subEditorDataStore";
import { isSubEditorNodeData } from "./types";
import classes from "./AdvancedNestedEditorExample.module.css";

type OpenEditorState = {
  nodeId: string;
  title: string;
  externalRefId: string;
};

const mainGridConfig: GridLayoutConfig = {
  areas: [["canvas"]],
  rows: [{ size: "1fr" }],
  columns: [{ size: "1fr" }],
  gap: "0",
};

const baseLayers: LayerDefinition[] = [
  {
    id: "canvas",
    component: <NodeCanvas />,
    gridArea: "canvas",
    zIndex: 0,
  },
  {
    id: "minimap",
    component: <Minimap width={220} height={160} />,
    positionMode: "absolute",
    position: { right: 24, bottom: 24 },
    zIndex: 50,
    draggable: true,
    width: 220,
    height: 160,
  },
];

const providedDefinitions: NodeDefinition[] = [
  asNodeDefinition(SubEditorNodeDefinition),
  asNodeDefinition(StandardNodeDefinition),
];

const buildExternalRefsFromData = (data: NodeEditorData): Record<string, ExternalDataReference> => {
  const refs: Record<string, ExternalDataReference> = {};
  for (const [nodeId, node] of Object.entries(data.nodes)) {
    if (node.type !== "sub-editor" || !isSubEditorNodeData(node.data)) {
      continue;
    }
    const refId = node.data.nestedEditorRefId || createSubEditorRefId(nodeId);
    ensureSubEditorData(refId, () => createDefaultSubEditorData(nodeId));
    refs[nodeId] = {
      id: refId,
      type: "sub-editor",
      metadata: { namespace: nodeId },
    };
  }
  return refs;
};

const initialExternalRefs = buildExternalRefsFromData(advancedNestedInitialData);

const buildInitialOpenEditors = (): Record<string, OpenEditorState> => {
  const automationRef = initialExternalRefs["sub-automation"];
  if (!automationRef) {
    return {};
  }
  return {
    "sub-automation": {
      nodeId: "sub-automation",
      title: "Automation Flow",
      externalRefId: automationRef.id,
    },
  };
};

export const AdvancedNestedEditorExample: React.FC = () => {
  const [externalDataRefs, setExternalDataRefs] = React.useState<Record<string, ExternalDataReference>>(() => ({
    ...initialExternalRefs,
  }));
  const [openEditors, setOpenEditors] = React.useState<Record<string, OpenEditorState>>(buildInitialOpenEditors);
  const handleOpenSubEditor = React.useCallback((request: SubEditorOpenRequest) => {
    setExternalDataRefs((prev) => {
      const current = prev[request.nodeId];
      if (current && current.id === request.externalRefId) {
        return prev;
      }
      return {
        ...prev,
        [request.nodeId]: {
          id: request.externalRefId,
          type: "sub-editor",
          metadata: { namespace: request.nodeId },
        },
      };
    });

    setOpenEditors((prev) => {
      const existing = prev[request.nodeId];
      if (existing && existing.externalRefId === request.externalRefId && existing.title === request.title) {
        return prev;
      }
      return {
        ...prev,
        [request.nodeId]: {
          nodeId: request.nodeId,
          title: request.title,
          externalRefId: request.externalRefId,
        },
      };
    });
  }, []);

  const handleCloseSubEditor = React.useCallback((nodeId: string) => {
    setOpenEditors((prev) => {
      if (!prev[nodeId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[nodeId];
      return next;
    });
  }, []);

  const handleDataChange = React.useCallback((data: NodeEditorData) => {
    setExternalDataRefs((prev) => {
      let mutated = false;
      const next: Record<string, ExternalDataReference> = { ...prev };
      const seen = new Set<string>();

      for (const [nodeId, node] of Object.entries(data.nodes)) {
        if (node.type !== "sub-editor" || !isSubEditorNodeData(node.data)) {
          if (next[nodeId]) {
            mutated = true;
            delete next[nodeId];
          }
          continue;
        }

        const refId = node.data.nestedEditorRefId || createSubEditorRefId(nodeId);
        ensureSubEditorData(refId, () => createDefaultSubEditorData(nodeId));

        const current = next[nodeId];
        if (!current || current.id !== refId) {
          next[nodeId] = {
            id: refId,
            type: "sub-editor",
            metadata: { namespace: nodeId },
          };
          mutated = true;
        }
        seen.add(nodeId);
      }

      for (const key of Object.keys(prev)) {
        if (!seen.has(key)) {
          mutated = true;
          delete next[key];
        }
      }

      return mutated ? next : prev;
    });

    setOpenEditors((prev) => {
      if (Object.keys(prev).length === 0) {
        return prev;
      }

      let mutated = false;
      const next: Record<string, OpenEditorState> = {};

      for (const key of Object.keys(prev)) {
        const editor = prev[key];
        const node = data.nodes[key];
        if (!node) {
          mutated = true;
          continue;
        }

        const nodeData = node.data;
        if (!isSubEditorNodeData(nodeData) || !nodeData.nestedEditorRefId) {
          mutated = true;
          continue;
        }

        const nextTitle = typeof nodeData.title === "string" ? nodeData.title : editor.title;
        const refId = nodeData.nestedEditorRefId;
        if (editor.title === nextTitle && editor.externalRefId === refId) {
          next[key] = editor;
          continue;
        }
        next[key] = { nodeId: key, title: nextTitle, externalRefId: refId };
        mutated = true;
      }

      if (!mutated && Object.keys(next).length === Object.keys(prev).length) {
        return prev;
      }

      return next;
    });
  }, []);

  const openEditorList = React.useMemo(() => Object.values(openEditors), [openEditors]);

  const subEditorLayers = React.useMemo<LayerDefinition[]>(() => {
    const layers: LayerDefinition[] = [];
    openEditorList.forEach((editor, index) => {
      const externalRef = externalDataRefs[editor.nodeId];
      if (!externalRef) {
        return;
      }
      layers.push({
        id: `sub-editor-window-${editor.nodeId}`,
        component: (
          <SubEditorWindow
            key={editor.nodeId}
            nodeId={editor.nodeId}
            title={editor.title}
            externalRef={externalRef}
            onClose={handleCloseSubEditor}
          />
        ),
        positionMode: "absolute",
        position: {
          right: 32 + index * 24,
          top: 32 + index * 24,
        },
        width: 440,
        height: 360,
        draggable: true,
        zIndex: 200 + index,
      });
    });
    return layers;
  }, [externalDataRefs, openEditorList, handleCloseSubEditor]);

  const gridLayers = React.useMemo<LayerDefinition[]>(() => [...baseLayers, ...subEditorLayers], [subEditorLayers]);

  const hostValue = React.useMemo(
    () => ({
      openSubEditor: handleOpenSubEditor,
    }),
    [handleOpenSubEditor],
  );

  return (
    <SubEditorHostProvider value={hostValue}>
      <div className={classes.wrapper}>
        <NodeEditor
          initialData={advancedNestedInitialData}
          onDataChange={handleDataChange}
          nodeDefinitions={providedDefinitions}
          includeDefaultDefinitions={false}
          externalDataRefs={externalDataRefs}
          gridConfig={mainGridConfig}
          gridLayers={gridLayers}
        />
      </div>
    </SubEditorHostProvider>
  );
};

export default AdvancedNestedEditorExample;

/*
debug-notes:
- Coordinated open editor state with SubEditorHostContext to prevent duplicate floating windows per node.
- Managed externalDataRefs map from NodeEditor data, enabling referential sub-editor updates without controlled data.
- Combined base canvas layers with dynamically generated LayerDefinition entries for each sub-editor window.
- Reviewed NodeEditor.tsx and GridLayout.tsx to confirm controlled-mode updates and draggable layer behaviour.
*/
