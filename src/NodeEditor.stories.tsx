/**
 * @file NodeEditor stories
 */
import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { NodeEditor } from "./NodeEditor";
import type { NodeEditorData } from "./types/core";
import { CustomNodeExample } from "./examples/demos/CustomNodeExample";

const meta = {
  title: "Extended/NodeEditor",
  component: NodeEditor,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: "100vw", height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NodeEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const initialStateWithConnections: Partial<NodeEditorData> = {
  nodes: {
    node1: {
      id: "node1",
      type: "standard",
      position: { x: 100, y: 100 },
      size: { width: 150, height: 80 },
      data: { title: "Input Node" },
    },
    node2: {
      id: "node2",
      type: "standard",
      position: { x: 400, y: 100 },
      size: { width: 150, height: 80 },
      data: { title: "Process Node" },
    },
  },
  connections: {
    conn1: {
      id: "conn1",
      fromNodeId: "node1",
      fromPortId: "output1",
      toNodeId: "node2",
      toPortId: "input1",
    },
  },
};

export const Default: Story = {
  args: {
    initialData: initialStateWithConnections,
  },
};

export const WithConnections: Story = {
  args: {
    initialData: initialStateWithConnections,
    onDataChange: (data: NodeEditorData) => {
      console.log("Data changed:", data);
      // Make data available globally for debugging
      if (typeof window !== "undefined") {
        (window as { nodeEditorData?: NodeEditorData }).nodeEditorData = data;
      }
    },
  },
};

export const Empty: Story = {
  args: {},
};

export const WithSaveLoad: Story = {
  args: {
    initialData: initialStateWithConnections,
    onSave: async (data: NodeEditorData) => {
      console.log("Saving data:", data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Store in localStorage for demo
      localStorage.setItem("nodeEditorData", JSON.stringify(data));
      console.log("Data saved!");
    },
    onLoad: async () => {
      console.log("Loading data...");
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Load from localStorage for demo
      const savedData = localStorage.getItem("nodeEditorData");
      if (savedData) {
        return JSON.parse(savedData);
      }
      return initialStateWithConnections as NodeEditorData;
    },
  },
};

export const ComplexFlow: Story = {
  args: {
    initialData: {
      nodes: {
        input1: {
          id: "input1",
          type: "standard",
          position: { x: 50, y: 50 },
          data: { title: "Input A" },
          ports: [{ id: "out1", nodeId: "input1", type: "output", label: "Output", position: "right" }],
        },
        input2: {
          id: "input2",
          type: "standard",
          position: { x: 50, y: 200 },
          data: { title: "Input B" },
          ports: [{ id: "out1", nodeId: "input2", type: "output", label: "Output", position: "right" }],
        },
        multiplexer: {
          id: "multiplexer",
          type: "standard",
          position: { x: 300, y: 125 },
          data: { title: "Multiplexer" },
          ports: [
            { id: "in1", nodeId: "multiplexer", type: "input", label: "Input 1", position: "left" },
            { id: "in2", nodeId: "multiplexer", type: "input", label: "Input 2", position: "left" },
            { id: "in3", nodeId: "multiplexer", type: "input", label: "Select", position: "left" },
            { id: "out1", nodeId: "multiplexer", type: "output", label: "Output", position: "right" },
          ],
        },
        processor: {
          id: "processor",
          type: "standard",
          position: { x: 550, y: 125 },
          data: { title: "Processor", content: "Transform data" },
          ports: [
            { id: "in1", nodeId: "processor", type: "input", label: "Input", position: "left" },
            { id: "out1", nodeId: "processor", type: "output", label: "Result", position: "right" },
            { id: "out2", nodeId: "processor", type: "output", label: "Status", position: "right" },
          ],
        },
        output: {
          id: "output",
          type: "standard",
          position: { x: 800, y: 125 },
          data: { title: "Output", visualState: "success" },
          ports: [
            { id: "in1", nodeId: "output", type: "input", label: "Data", position: "left" },
            { id: "in2", nodeId: "output", type: "input", label: "Status", position: "left" },
          ],
        },
      },
      connections: {
        conn1: {
          id: "conn1",
          fromNodeId: "input1",
          fromPortId: "out1",
          toNodeId: "multiplexer",
          toPortId: "in1",
        },
        conn2: {
          id: "conn2",
          fromNodeId: "input2",
          fromPortId: "out1",
          toNodeId: "multiplexer",
          toPortId: "in2",
        },
        conn3: {
          id: "conn3",
          fromNodeId: "multiplexer",
          fromPortId: "out1",
          toNodeId: "processor",
          toPortId: "in1",
        },
        conn4: {
          id: "conn4",
          fromNodeId: "processor",
          fromPortId: "out1",
          toNodeId: "output",
          toPortId: "in1",
        },
        conn5: {
          id: "conn5",
          fromNodeId: "processor",
          fromPortId: "out2",
          toNodeId: "output",
          toPortId: "in2",
        },
      },
    },
  },
};

export const CustomNodes: Story = {
  render: () => <CustomNodeExample />,
  parameters: {
    layout: "fullscreen",
  },
};
