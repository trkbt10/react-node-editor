/**
 * @file Advanced example demonstrating nested editors within nodes
 */
import * as React from "react";
import { NodeEditor } from "../../../../index";
import { NodeCanvas } from "../../../../components/canvas/NodeCanvas";
import { Minimap } from "../../../../components/layers/Minimap";
import type { GridLayoutConfig, LayerDefinition } from "../../../../types/panels";
import type { NodeEditorData } from "../../../../types/core";
import { toUntypedDefinition, type NodeDefinition } from "../../../../types/NodeDefinition";
import { StandardNodeDefinition } from "../../../../node-definitions/standard";
import {
  SubEditorHostProvider,
  type SubEditorOpenRequest,
} from "./SubEditorHostContext";
import { SubEditorNodeDefinition } from "./SubEditorNode";
import { SubEditorWindow } from "./SubEditorWindow";
import { advancedNestedInitialData } from "./initialData";
import { isSubEditorNodeData } from "./types";
import classes from "./AdvancedNestedEditorExample.module.css";

type OpenEditorState = {
  nodeId: string;
  title: string;
  data: NodeEditorData;
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
  toUntypedDefinition(SubEditorNodeDefinition),
  toUntypedDefinition(StandardNodeDefinition),
];

export const AdvancedNestedEditorExample: React.FC = () => {
  const [editorData, setEditorData] =
    React.useState<NodeEditorData>(advancedNestedInitialData);
  const [openEditors, setOpenEditors] = React.useState<Record<string, OpenEditorState>>({});

  const handleOpenSubEditor = React.useCallback(
    (request: SubEditorOpenRequest) => {
      setEditorData((prev) => {
        const target = prev.nodes[request.nodeId];
        if (!target) {
          return prev;
        }
        const nodeData = target.data;
        if (
          isSubEditorNodeData(nodeData) &&
          nodeData.nestedEditorData === request.data &&
          nodeData.title === request.title
        ) {
          return prev;
        }
        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [request.nodeId]: {
              ...target,
              data: {
                ...nodeData,
                title: request.title,
                nestedEditorData: request.data,
                lastUpdated: new Date().toISOString(),
              },
            },
          },
        };
      });

      setOpenEditors((prev) => {
        if (prev[request.nodeId]) {
          return prev;
        }
        return {
          ...prev,
          [request.nodeId]: {
            nodeId: request.nodeId,
            title: request.title,
            data: request.data,
          },
        };
      });
    },
    [],
  );

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

  const handleNestedEditorChange = React.useCallback(
    (nodeId: string, nestedData: NodeEditorData) => {
      setEditorData((prev) => {
        const target = prev.nodes[nodeId];
        if (!target) {
          return prev;
        }
        const currentData = target.data;
        if (
          isSubEditorNodeData(currentData) &&
          currentData.nestedEditorData === nestedData
        ) {
          return prev;
        }
        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [nodeId]: {
              ...target,
              data: {
                ...currentData,
                nestedEditorData: nestedData,
                lastUpdated: new Date().toISOString(),
              },
            },
          },
        };
      });

      setOpenEditors((prev) => {
        const entry = prev[nodeId];
        if (!entry || entry.data === nestedData) {
          return prev;
        }
        return {
          ...prev,
          [nodeId]: { ...entry, data: nestedData },
        };
      });
    },
    [],
  );

  const handleDataChange = React.useCallback((data: NodeEditorData) => {
    setEditorData(data);
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
        if (!isSubEditorNodeData(nodeData) || !nodeData.nestedEditorData) {
          mutated = true;
          continue;
        }

        const nextTitle =
          typeof nodeData.title === "string" ? nodeData.title : editor.title;
        const nested = nodeData.nestedEditorData;
        if (editor.data === nested && editor.title === nextTitle) {
          next[key] = editor;
        } else {
          next[key] = { nodeId: key, title: nextTitle, data: nested };
          mutated = true;
        }
      }

      if (!mutated && Object.keys(next).length === Object.keys(prev).length) {
        return prev;
      }

      return next;
    });
  }, []);

  const openEditorList = React.useMemo(
    () => Object.values(openEditors),
    [openEditors],
  );

  const subEditorLayers = React.useMemo<LayerDefinition[]>(() => {
    return openEditorList.map((editor, index) => ({
      id: `sub-editor-window-${editor.nodeId}`,
      component: (
        <SubEditorWindow
          key={editor.nodeId}
          nodeId={editor.nodeId}
          title={editor.title}
          data={editor.data}
          onClose={handleCloseSubEditor}
          onDataChange={handleNestedEditorChange}
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
    }));
  }, [openEditorList, handleCloseSubEditor, handleNestedEditorChange]);

  const gridLayers = React.useMemo<LayerDefinition[]>(
    () => [...baseLayers, ...subEditorLayers],
    [subEditorLayers],
  );

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
          data={editorData}
          onDataChange={handleDataChange}
          nodeDefinitions={providedDefinitions}
          includeDefaultDefinitions={false}
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
- Combined base canvas layers with dynamically generated LayerDefinition entries for each sub-editor window.
- Reviewed NodeEditor.tsx and GridLayout.tsx to confirm controlled-mode updates and draggable layer behaviour.
*/
