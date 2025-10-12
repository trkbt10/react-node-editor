import * as React from "react";
import { NodeEditor } from "../../NodeEditor";
import type {
  NodeDefinition,
  NodeRenderProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../types/NodeDefinition";
import { toUntypedDefinition } from "../../types/NodeDefinition";
import type { NodeEditorData } from "../../types/core";
import { StandardNodeDefinition } from "../../node-definitions/standard";
import classes from "./CustomNodeExample.module.css";

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
  _node,
  isSelected,
  isDragging,
  externalData,
  isLoadingExternalData,
  onStartEdit,
  onUpdateNode: _onUpdateNode,
}: NodeRenderProps) => {
  const task = externalData as TaskData | undefined;

  const getStatusClass = (status?: string) => {
    switch (status) {
      case "done":
        return classes.statusDone;
      case "in-progress":
        return classes.statusInProgress;
      case "todo":
        return classes.statusTodo;
      default:
        return classes.statusDefault;
    }
  };

  const nodeClasses = [
    classes.taskNode,
    isSelected && classes.selected,
    isDragging && classes.dragging,
    isDragging ? classes.grabbing : classes.grab,
    getStatusClass(task?.status),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={nodeClasses} onDoubleClick={onStartEdit}>
      {isLoadingExternalData ? (
        <div className={classes.taskNodeLoading}>Loading...</div>
      ) : task ? (
        <>
          <h3 className={classes.taskNodeTitle}>{task.title}</h3>
          <p className={classes.taskNodeDescription}>{task.description}</p>
          <div className={classes.taskNodeFooter}>
            <span className={classes.taskNodeStatus}>{task.status}</span>
            {task.assignee && <span>👤 {task.assignee}</span>}
          </div>
        </>
      ) : (
        <div className={classes.taskNodeNoData}>No task data</div>
      )}
    </div>
  );
};

// Custom Task Inspector
const TaskInspectorRenderer = ({
  _node,
  externalData,
  isLoadingExternalData,
  onUpdateNode: _onUpdateNode,
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
    return <div className={classes.inspectorContainer}>Loading task data...</div>;
  }

  if (!editedTask) {
    return <div className={classes.inspectorContainer}>No task data available</div>;
  }

  return (
    <div className={classes.inspectorContainer}>
      <h3 className={classes.inspectorTitle}>Task Properties</h3>

      <div className={classes.inspectorField}>
        <label htmlFor="task-title" className={classes.inspectorLabel}>
          Title:
        </label>
        <input
          id="task-title"
          name="taskTitle"
          type="text"
          value={editedTask.title}
          onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
          className={classes.inspectorInput}
        />
      </div>

      <div className={classes.inspectorField}>
        <label htmlFor="task-description" className={classes.inspectorLabel}>
          Description:
        </label>
        <textarea
          id="task-description"
          name="taskDescription"
          value={editedTask.description}
          onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
          className={classes.inspectorTextarea}
        />
      </div>

      <div className={classes.inspectorField}>
        <label htmlFor="task-status" className={classes.inspectorLabel}>
          Status:
        </label>
        <select
          id="task-status"
          name="taskStatus"
          value={editedTask.status}
          onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as TaskData["status"] })}
          className={classes.inspectorSelect}
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className={classes.inspectorField}>
        <label htmlFor="task-assignee" className={classes.inspectorLabel}>
          Assignee:
        </label>
        <input
          id="task-assignee"
          name="taskAssignee"
          type="text"
          value={editedTask.assignee || ""}
          onChange={(e) => setEditedTask({ ...editedTask, assignee: e.target.value })}
          className={classes.inspectorInput}
        />
      </div>

      <div className={classes.inspectorActions}>
        <button onClick={handleSave} className={`${classes.inspectorButton} ${classes.inspectorButtonSave}`}>
          Save Changes
        </button>
        <button onClick={onDeleteNode} className={`${classes.inspectorButton} ${classes.inspectorButtonDelete}`}>
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
    },
    "node-2": {
      id: "node-2",
      type: "task",
      position: { x: 400, y: 100 },
      size: { width: 220, height: 120 },
      data: { title: "Task 2" },
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
  return (
    <NodeEditor
      initialData={initialData}
      nodeDefinitions={[TaskNodeDefinition, toUntypedDefinition(StandardNodeDefinition)]}
      externalDataRefs={externalDataRefs}
      onDataChange={(data) => {
        console.log("Editor data changed:", data);
      }}
      autoSaveEnabled={false}
      onSave={async (data) => {
        console.log("Saving data:", data);
      }}
    />
  );
};

export default CustomNodeExample;
