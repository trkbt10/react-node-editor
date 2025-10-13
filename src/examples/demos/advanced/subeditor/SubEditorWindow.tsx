/**
 * @file Floating window that hosts the nested node editor for a sub-editor node
 */
import * as React from "react";
import { Button } from "../../../../components/elements";
import { NodeCanvas } from "../../../../components/canvas/NodeCanvas";
import {
  FloatingPanelFrame,
  FloatingPanelHeader,
  FloatingPanelTitle,
  FloatingPanelMeta,
  FloatingPanelControls,
  FloatingPanelContent,
} from "../../../../components/panels/FloatingPanelFrame";
import { NodeEditor } from "../../../../index";
import { StandardNodeDefinition } from "../../../../node-definitions/standard";
import { toUntypedDefinition } from "../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../types/core";
import type { GridLayoutConfig, LayerDefinition } from "../../../../types/panels";
import styles from "./SubEditorWindow.module.css";

export type SubEditorWindowProps = {
  nodeId: string;
  title: string;
  data: NodeEditorData;
  onClose: (nodeId: string) => void;
  onDataChange: (nodeId: string, data: NodeEditorData) => void;
};

export const SubEditorWindow: React.FC<SubEditorWindowProps> = ({ nodeId, title, data, onClose, onDataChange }) => {
  const nodeCount = React.useMemo(() => Object.keys(data.nodes).length, [data.nodes]);
  const connectionCount = React.useMemo(() => Object.keys(data.connections).length, [data.connections]);

  const gridConfig = React.useMemo<GridLayoutConfig>(
    () => ({
      areas: [["canvas"]],
      rows: [{ size: "1fr" }],
      columns: [{ size: "1fr" }],
      gap: "0",
    }),
    [],
  );

  const gridLayers = React.useMemo<LayerDefinition[]>(
    () => [
      {
        id: "canvas",
        component: <NodeCanvas />,
        gridArea: "canvas",
        zIndex: 0,
      },
    ],
    [],
  );

  const nestedDefinitions = React.useMemo(() => [toUntypedDefinition(StandardNodeDefinition)], []);

  const handleClose = React.useCallback(() => {
    onClose(nodeId);
  }, [onClose, nodeId]);

  const handleDataChange = React.useCallback(
    (nextData: NodeEditorData) => {
      onDataChange(nodeId, nextData);
    },
    [nodeId, onDataChange],
  );

  return (
    <FloatingPanelFrame>
      <FloatingPanelHeader>
        <FloatingPanelTitle>{title}</FloatingPanelTitle>
        <FloatingPanelMeta>
          {nodeCount} nodes · {connectionCount} connections
        </FloatingPanelMeta>
        <FloatingPanelControls className={styles.controls}>
          <Button variant="ghost" size="small" onClick={handleClose} aria-label={`Close ${title} window`}>
            Close
          </Button>
        </FloatingPanelControls>
      </FloatingPanelHeader>
      <FloatingPanelContent className={styles.windowContent}>
        <div className={styles.summary}>
          <span>
            Node <strong>{nodeId}</strong>
          </span>
          <span>Nested editor is fully interactive.</span>
        </div>
        <div className={styles.editorShell}>
          <NodeEditor
            className={styles.editorMain}
            data={data}
            onDataChange={handleDataChange}
            nodeDefinitions={nestedDefinitions}
            includeDefaultDefinitions={false}
            gridConfig={gridConfig}
            gridLayers={gridLayers}
          />
        </div>
      </FloatingPanelContent>
    </FloatingPanelFrame>
  );
};

/*
debug-notes:
- Embeds a secondary NodeEditor with its own GridLayout so nested flows remain isolated.
- Close control updates parent state via onClose callback to remove layer entry.
*/
