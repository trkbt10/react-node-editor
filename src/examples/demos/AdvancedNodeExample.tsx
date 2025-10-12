/**
 * @file Advanced Node Editor Example - Demonstrates custom node renderers
 */
import * as React from "react";
import { NodeEditor } from "../../NodeEditor";
import type { ExternalDataReference } from "../../types/NodeDefinition";
import type { NodeEditorData } from "../../types/core";
import { CodeNodeDefinition } from "./advanced/nodes/CodeEditorNode";
import { ChartNodeDefinition } from "./advanced/nodes/ChartNode";
import { FormNodeDefinition } from "./advanced/nodes/FormBuilderNode";
import { MusicPlayerNodeDefinition } from "./advanced/nodes/MusicPlayerNode";
import { ParticleSystemNodeDefinition } from "./advanced/nodes/ParticleSystemNode";
import { AIChatNodeDefinition } from "./advanced/nodes/AIChatNode";
import { GamePadNodeDefinition } from "./advanced/nodes/GamePadNode";
import { NumberInputNodeDefinition } from "./advanced/nodes/NumberInputNode";
import { JavaScriptCodeNodeDefinition } from "./advanced/nodes/JavaScriptCodeNode";
import classes from "./AdvancedNodeExample.module.css";

// =============================================
// Example Data
// =============================================

const advancedInitialData: NodeEditorData = {
  nodes: {
    "code-1": {
      id: "code-1",
      type: "code-editor",
      position: { x: 50, y: 50 },
      size: { width: 280, height: 160 },
      data: { title: "Frontend Code", language: "typescript" },
    },
    "chart-1": {
      id: "chart-1",
      type: "chart",
      position: { x: 380, y: 50 },
      size: { width: 200, height: 140 },
      data: { title: "Performance Chart" },
    },
    "music-1": {
      id: "music-1",
      type: "music-player",
      position: { x: 50, y: 250 },
      size: { width: 300, height: 180 },
      data: { title: "Music Player" },
    },
    "chat-1": {
      id: "chat-1",
      type: "ai-chat",
      position: { x: 380, y: 250 },
      size: { width: 320, height: 240 },
      data: { title: "AI Assistant" },
    },
    "form-1": {
      id: "form-1",
      type: "form-builder",
      position: { x: 620, y: 50 },
      size: { width: 250, height: 120 },
      data: { title: "User Registration" },
    },
    "gamepad-1": {
      id: "gamepad-1",
      type: "gamepad",
      position: { x: 50, y: 520 },
      size: { width: 280, height: 220 },
      data: { title: "Game Pad" },
    },
    "number-1": {
      id: "number-1",
      type: "number-input",
      position: { x: 50, y: 780 },
      size: { width: 200, height: 140 },
      data: { title: "Emit Count" },
    },
    "particle-1": {
      id: "particle-1",
      type: "particle-system",
      position: { x: 380, y: 540 },
      size: { width: 300, height: 280 },
      data: { title: "Particle Effects" },
    },
    "js-code-1": {
      id: "js-code-1",
      type: "javascript-code",
      position: { x: 50, y: 960 },
      size: { width: 320, height: 240 },
      data: { title: "Custom Physics" },
    },
  },
  connections: {
    "conn-1": {
      id: "conn-1",
      fromNodeId: "code-1",
      fromPortId: "output",
      toNodeId: "chart-1",
      toPortId: "data-input",
    },
    "conn-2": {
      id: "conn-2",
      fromNodeId: "gamepad-1",
      fromPortId: "position-output",
      toNodeId: "particle-1",
      toPortId: "position-input",
    },
    "conn-4": {
      id: "conn-4",
      fromNodeId: "gamepad-1",
      fromPortId: "a-output",
      toNodeId: "particle-1",
      toPortId: "emit-a-input",
    },
    "conn-5": {
      id: "conn-5",
      fromNodeId: "gamepad-1",
      fromPortId: "b-output",
      toNodeId: "particle-1",
      toPortId: "emit-b-input",
    },
    "conn-6": {
      id: "conn-6",
      fromNodeId: "number-1",
      fromPortId: "value-output",
      toNodeId: "particle-1",
      toPortId: "count-input",
    },
    "conn-7": {
      id: "conn-7",
      fromNodeId: "js-code-1",
      fromPortId: "code-output",
      toNodeId: "particle-1",
      toPortId: "physics-code-input",
    },
    "conn-3": {
      id: "conn-3",
      fromNodeId: "music-1",
      fromPortId: "visualization",
      toNodeId: "chat-1",
      toPortId: "context",
    },
  },
};

const advancedExternalDataRefs: Record<string, ExternalDataReference> = {
  "code-1": { id: "frontend-ts", type: "code" },
  "chart-1": { id: "perf-chart", type: "chart" },
  "music-1": { id: "music-player", type: "music" },
  "particle-1": { id: "particle-fx", type: "particle" },
  "chat-1": { id: "ai-chat", type: "chat" },
  "gamepad-1": { id: "gamepad", type: "gamepad" },
  "form-1": { id: "registration-form", type: "form" },
  "number-1": { id: "number-input", type: "number" },
  "js-code-1": { id: "physics-code", type: "javascript-code" },
};

// =============================================
// Main Component
// =============================================

export const AdvancedNodeExample: React.FC = () => {
  const [editorData, setEditorData] = React.useState<NodeEditorData>(advancedInitialData);

  const onDataChange = React.useCallback((data: NodeEditorData) => {
    // Propagate data through connections
    const updatedNodes = { ...data.nodes };
    let hasChanges = false;

    Object.values(data.connections).forEach((connection) => {
      const fromNode = updatedNodes[connection.fromNodeId];
      const toNode = updatedNodes[connection.toNodeId];

      if (fromNode && toNode) {
        // Get data from output port
        const outputData = fromNode.data[connection.fromPortId];

        // Set data to input port
        if (outputData !== undefined) {
          const currentInputData = toNode.data[connection.toPortId];

          // Only update if data changed
          if (JSON.stringify(currentInputData) !== JSON.stringify(outputData)) {
            updatedNodes[connection.toNodeId] = {
              ...toNode,
              data: {
                ...toNode.data,
                [connection.toPortId]: outputData,
              },
            };
            hasChanges = true;
          }
        }
      }
    });

    // Update editor data if there were changes
    if (hasChanges) {
      setEditorData({
        ...data,
        nodes: updatedNodes,
      });
    } else {
      setEditorData(data);
    }
  }, []);
  return (
    <div className={classes.content}>
      <NodeEditor
        data={editorData}
        nodeDefinitions={[
          CodeNodeDefinition,
          ChartNodeDefinition,
          FormNodeDefinition,
          MusicPlayerNodeDefinition,
          ParticleSystemNodeDefinition,
          AIChatNodeDefinition,
          GamePadNodeDefinition,
          NumberInputNodeDefinition,
          JavaScriptCodeNodeDefinition,
        ]}
        externalDataRefs={advancedExternalDataRefs}
        onDataChange={onDataChange}
        onSave={async (data) => {
          console.log("Saving advanced editor data:", data);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }}
      />
    </div>
  );
};

export default AdvancedNodeExample;
