/**
 * @file Inspector properties tab component
 */
import * as React from "react";
import { useEditorActionState } from "../../../contexts/EditorActionStateContext";
import { useNodeEditor } from "../../../contexts/node-editor/context";
import { NodeInspector } from "../panels/NodeInspector";
import { InspectorSection } from "../parts/InspectorSection";
import { ConnectionPropertiesSection } from "../../controls/connectionProperties/ConnectionPropertiesSection";
import styles from "../InspectorPanel.module.css";
import { useI18n } from "../../../i18n/context";

export const InspectorPropertiesTab: React.FC = () => {
  const { state: nodeEditorState } = useNodeEditor();
  const { state: actionState } = useEditorActionState();
  const { t } = useI18n();

  const selectedNode =
    actionState.editingSelectedNodeIds.length > 0 ? nodeEditorState.nodes[actionState.editingSelectedNodeIds[0]] : null;

  const selectedConnection =
    actionState.selectedConnectionIds.length > 0
      ? nodeEditorState.connections[actionState.selectedConnectionIds[0]]
      : null;

  return (
    <>
      {selectedNode && (
        <InspectorSection>
          <NodeInspector node={selectedNode} />
        </InspectorSection>
      )}

      {selectedConnection && (
        <InspectorSection>
          <ConnectionPropertiesSection connection={selectedConnection} nodes={nodeEditorState.nodes} />
        </InspectorSection>
      )}

      {!selectedNode && !selectedConnection && (
        <div className={styles.inspectorEmptyState}>
          <p>{t("inspectorEmptyStatePrompt")}</p>
        </div>
      )}
    </>
  );
};

InspectorPropertiesTab.displayName = "InspectorPropertiesTab";
