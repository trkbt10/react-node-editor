import * as React from "react";
import { NodeEditor } from "../NodeEditor";
import type {
  NodeDefinition,
  NodeRenderProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../types/NodeDefinition";
import type { NodeEditorData } from "../types/core";

// Example external data type
type TaskData = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  assignee?: string;
  dueDate?: string;
};

// Mock external data storage
const mockTaskDatabase = new Map<string, TaskData>([
  [
    "task-1",
    {
      id: "task-1",
      title: "Design System Review",
      description: "Review and approve the new design system components",
      status: "in-progress",
      assignee: "Alice",
      dueDate: "2024-02-15",
    },
  ],
  [
    "task-2",
    {
      id: "task-2",
      title: "API Integration",
      description: "Integrate the backend API with the frontend",
      status: "todo",
      assignee: "Bob",
      dueDate: "2024-02-20",
    },
  ],
]);

// Custom Task Node Renderer
const TaskNodeRenderer = ({
  node,
  isSelected,
  isDragging,
  externalData,
  isLoadingExternalData,
  onStartEdit,
  onUpdateNode,
}: NodeRenderProps) => {
  const task = externalData as TaskData | undefined;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "done":
        return "#34c759";
      case "in-progress":
        return "#007aff";
      case "todo":
        return "#8e8e93";
      default:
        return "#c7c7cc";
    }
  };

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: isSelected ? "#e3f2fd" : "#ffffff",
        opacity: isDragging ? 0.7 : 1,
        border: `2px solid ${getStatusColor(task?.status)}`,
        cursor: isDragging ? "grabbing" : "grab",
        minHeight: "80px",
      }}
      onDoubleClick={onStartEdit}
    >
      {isLoadingExternalData ? (
        <div style={{ textAlign: "center", color: "#999" }}>Loading...</div>
      ) : task ? (
        <>
          <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600 }}>{task.title}</h3>
          <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666" }}>{task.description}</p>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
            <span style={{ color: getStatusColor(task.status) }}>{task.status.toUpperCase()}</span>
            {task.assignee && <span>👤 {task.assignee}</span>}
          </div>
        </>
      ) : (
        <div style={{ color: "#999" }}>No task data</div>
      )}
    </div>
  );
};

// Custom Task Inspector
const TaskInspectorRenderer = ({
  node,
  externalData,
  isLoadingExternalData,
  onUpdateNode,
  onUpdateExternalData,
  onDeleteNode,
}: InspectorRenderProps) => {
  const task = externalData as TaskData | undefined;
  const [editedTask, setEditedTask] = React.useState<TaskData | null>(null);

  React.useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  const handleSave = async () => {
    if (editedTask && onUpdateExternalData) {
      await onUpdateExternalData(editedTask);
    }
  };

  if (isLoadingExternalData) {
    return <div style={{ padding: "16px" }}>Loading task data...</div>;
  }

  if (!editedTask) {
    return <div style={{ padding: "16px" }}>No task data available</div>;
  }

  return (
    <div style={{ padding: "16px" }}>
      <h3>Task Properties</h3>

      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="task-title" style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
          Title:
        </label>
        <input
          id="task-title"
          name="taskTitle"
          type="text"
          value={editedTask.title}
          onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
          style={{ width: "100%", padding: "4px 8px" }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="task-description" style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
          Description:
        </label>
        <textarea
          id="task-description"
          name="taskDescription"
          value={editedTask.description}
          onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
          style={{ width: "100%", padding: "4px 8px", minHeight: "60px" }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="task-status" style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
          Status:
        </label>
        <select
          id="task-status"
          name="taskStatus"
          value={editedTask.status}
          onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as TaskData["status"] })}
          style={{ width: "100%", padding: "4px 8px" }}
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="task-assignee" style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
          Assignee:
        </label>
        <input
          id="task-assignee"
          name="taskAssignee"
          type="text"
          value={editedTask.assignee || ""}
          onChange={(e) => setEditedTask({ ...editedTask, assignee: e.target.value })}
          style={{ width: "100%", padding: "4px 8px" }}
        />
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007aff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            flex: 1,
          }}
        >
          Save Changes
        </button>
        <button
          onClick={onDeleteNode}
          style={{
            padding: "8px 16px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// Task Node Definition
const TaskNodeDefinition: NodeDefinition = {
  type: "task",
  displayName: "Task Node",
  description: "A node representing a task with external data",
  category: "Project Management",
  defaultData: {
    title: "New Task",
  },
  defaultSize: { width: 220, height: 120 },
  ports: [
    {
      id: "depends-on",
      type: "input",
      label: "Depends On",
      position: "left",
    },
    {
      id: "blocks",
      type: "output",
      label: "Blocks",
      position: "right",
    },
  ],
  renderNode: TaskNodeRenderer,
  renderInspector: TaskInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockTaskDatabase.get(ref.id);
  },
  updateExternalData: async (ref: ExternalDataReference, data: unknown) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    const taskData = data as TaskData;
    mockTaskDatabase.set(ref.id, taskData);
  },
};

// Example initial data
const initialData: NodeEditorData = {
  nodes: {
    "node-1": {
      id: "node-1",
      type: "task",
      position: { x: 100, y: 100 },
      size: { width: 220, height: 120 },
      data: { title: "Task 1" },
      _ports:
        TaskNodeDefinition.ports?.map((portDef) => ({
          ...portDef,
          nodeId: "node-1",
        })) || [],
    },
    "node-2": {
      id: "node-2",
      type: "task",
      position: { x: 400, y: 100 },
      size: { width: 220, height: 120 },
      data: { title: "Task 2" },
      _ports:
        TaskNodeDefinition.ports?.map((portDef) => ({
          ...portDef,
          nodeId: "node-2",
        })) || [],
    },
    "node-3": {
      id: "node-3",
      type: "standard",
      position: { x: 250, y: 300 },
      data: { title: "Standard Node", content: "This uses the default renderer" },
    },
  },
  connections: {
    "conn-1": {
      id: "conn-1",
      fromNodeId: "node-1",
      fromPortId: "blocks",
      toNodeId: "node-2",
      toPortId: "depends-on",
    },
  },
};

// External data references
const externalDataRefs: Record<string, ExternalDataReference> = {
  "node-1": {
    id: "task-1",
    type: "task",
  },
  "node-2": {
    id: "task-2",
    type: "task",
  },
};

/**
 * Example of using custom node definitions with external data
 */
export const CustomNodeExample: React.FC = () => {
  const [savedData, setSavedData] = React.useState<NodeEditorData | null>(null);

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", borderBottom: "1px solid #e0e0e0" }}>
        <h2 style={{ margin: 0 }}>Custom Node Editor Example</h2>
        <p style={{ margin: "8px 0 0", color: "#666" }}>
          This example shows custom task nodes with external data loading and custom rendering.
        </p>
      </div>

      <div style={{ flex: 1 }}>
        <NodeEditor
          initialData={initialData}
          nodeDefinitions={[TaskNodeDefinition]}
          externalDataRefs={externalDataRefs}
          onDataChange={(data) => {
            console.log("Editor data changed:", data);
          }}
          onSave={async (data) => {
            console.log("Saving data:", data);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setSavedData(data);
            alert("Data saved successfully!");
          }}
        />
      </div>

      {savedData && (
        <div style={{ padding: "8px", background: "#f5f5f5", fontSize: "12px" }}>
          Last saved: {new Date().toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default CustomNodeExample;
