/**
 * @file Inspector properties tab component
 */
import * as React from "react";
import { useEditorActionState } from "../../../contexts/EditorActionStateContext";
import { useNodeEditor } from "../../../contexts/node-editor/context";
import { NodeInspector } from "../panels/NodeInspector";
import { H4 } from "../../elements/Heading";
import { InspectorField } from "../parts/InspectorField";
import { InspectorSection } from "../parts/InspectorSection";
import { InspectorSectionTitle } from "../parts/InspectorSectionTitle";
import styles from "../InspectorPanel.module.css";
import { useI18n } from "../../../i18n/context";

export const InspectorPropertiesTab: React.FC = () => {
  const { state: nodeEditorState } = useNodeEditor();
  const { state: actionState } = useEditorActionState();
  const { t } = useI18n();

  const selectedNode =
    actionState.editingSelectedNodeIds.length > 0
      ? nodeEditorState.nodes[actionState.editingSelectedNodeIds[0]]
      : null;

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
          <InspectorSectionTitle>{t("inspectorConnectionProperties")}</InspectorSectionTitle>
          <InspectorField label="From:">
            <span className={styles.inspectorReadOnlyField}>
              {(nodeEditorState.nodes[selectedConnection.fromNodeId]?.data.title?.trim()?.length ?? 0) > 0
                ? nodeEditorState.nodes[selectedConnection.fromNodeId]?.data.title
                : t("untitled")}
              .{selectedConnection.fromPortId}
            </span>
          </InspectorField>
          <InspectorField label="To:">
            <span className={styles.inspectorReadOnlyField}>
              {(nodeEditorState.nodes[selectedConnection.toNodeId]?.data.title?.trim()?.length ?? 0) > 0
                ? nodeEditorState.nodes[selectedConnection.toNodeId]?.data.title
                : t("untitled")}
              .{selectedConnection.toPortId}
            </span>
          </InspectorField>
        </InspectorSection>
      )}

      {!selectedNode && !selectedConnection && (
        <div className={styles.inspectorEmptyState}>
          <p>{t("inspectorEmptyStatePrompt")}</p>
        </div>
      )}

      {actionState.editingSelectedNodeIds.length > 1 && (
        <InspectorSection>
          <H4>{t("inspectorMultipleSelection")}</H4>
          <p>{actionState.editingSelectedNodeIds.length} nodes selected</p>
        </InspectorSection>
      )}
    </>
  );
};

InspectorPropertiesTab.displayName = "InspectorPropertiesTab";
