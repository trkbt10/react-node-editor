/**
 * @file AI Chat Node - Interactive chatbot interface
 */
import * as React from "react";
import type {
  NodeDefinition,
  NodeRendererProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../../../../types/NodeDefinition";
import classes from "./AIChatNode.module.css";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
};

export type ChatData = {
  id: string;
  botName: string;
  botAvatar: string;
  messages: ChatMessage[];
  isTyping: boolean;
  temperature: number;
  model: string;
};

export const AIChatRenderer = ({ node, isSelected, isDragging, externalData }: NodeRendererProps) => {
  const chatData = externalData as ChatData | undefined;
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const chatColor = "#06b6d4";

  return (
    <div
      className={`${classes.container} ${isSelected ? classes.selected : ""} ${isDragging ? classes.dragging : ""}`}
      style={{
        width: node.size?.width,
        height: node.size?.height,
        border: `2px solid ${chatColor}`,
      }}
    >
      <div className={classes.header} style={{ backgroundColor: chatColor }}>
        <div className={classes.botInfo}>
          <span className={classes.botAvatar}>{chatData?.botAvatar || "🤖"}</span>
          <div className={classes.botDetails}>
            <div className={classes.botName}>{chatData?.botName || "AI Assistant"}</div>
            <div className={classes.botStatus}>{chatData?.isTyping ? "typing..." : "online"}</div>
          </div>
        </div>
        <div className={classes.modelBadge}>{chatData?.model || "GPT-4"}</div>
      </div>

      <div className={classes.messagesContainer}>
        {chatData?.messages?.slice(-3).map((message, index) => (
          <div
            key={index}
            className={`${classes.message} ${message.role === "user" ? classes.userMessage : classes.assistantMessage}`}
          >
            <div className={classes.messageContent}>{message.content}</div>
          </div>
        ))}
        {chatData?.isTyping && (
          <div className={classes.typingIndicator}>
            <span className={classes.dot} />
            <span className={classes.dot} />
            <span className={classes.dot} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={classes.inputArea}>
        <span className={classes.inputPlaceholder}>Type a message...</span>
      </div>
    </div>
  );
};

export const AIChatInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
  const chatData = externalData as ChatData | undefined;
  const [editedData, setEditedData] = React.useState<ChatData>({
    id: chatData?.id || "",
    botName: chatData?.botName || "AI Assistant",
    botAvatar: chatData?.botAvatar || "🤖",
    messages: chatData?.messages || [],
    isTyping: chatData?.isTyping || false,
    temperature: chatData?.temperature || 0.7,
    model: chatData?.model || "GPT-4",
  });

  const [newMessage, setNewMessage] = React.useState("");

  const addMessage = (role: "user" | "assistant") => {
    if (!newMessage.trim()) {
      return;
    }
    setEditedData((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          role,
          content: newMessage,
          timestamp: Date.now(),
        },
      ],
    }));
    setNewMessage("");
  };

  const clearMessages = () => {
    setEditedData((prev) => ({ ...prev, messages: [] }));
  };

  const handleSave = async () => {
    if (onUpdateExternalData) {
      await onUpdateExternalData(editedData);
    }
  };

  return (
    <div className={classes.inspector}>
      <h3>AI Chat Configuration</h3>

      <div className={classes.formGroup}>
        <label htmlFor="bot-name" className={classes.label}>
          Bot Name:
        </label>
        <input
          id="bot-name"
          name="botName"
          type="text"
          value={editedData.botName}
          onChange={(e) => setEditedData({ ...editedData, botName: e.target.value })}
          className={classes.input}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="bot-avatar" className={classes.label}>
          Bot Avatar (emoji):
        </label>
        <input
          id="bot-avatar"
          name="botAvatar"
          type="text"
          value={editedData.botAvatar}
          onChange={(e) => setEditedData({ ...editedData, botAvatar: e.target.value })}
          className={classes.input}
          maxLength={2}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="bot-model" className={classes.label}>
          Model:
        </label>
        <select
          id="bot-model"
          name="botModel"
          value={editedData.model}
          onChange={(e) => setEditedData({ ...editedData, model: e.target.value })}
          className={classes.select}
        >
          <option value="GPT-4">GPT-4</option>
          <option value="GPT-3.5">GPT-3.5</option>
          <option value="Claude">Claude</option>
          <option value="Gemini">Gemini</option>
        </select>
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="temperature" className={classes.label}>
          Temperature: {editedData.temperature.toFixed(1)}
        </label>
        <input
          id="temperature"
          name="temperature"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={editedData.temperature}
          onChange={(e) => setEditedData({ ...editedData, temperature: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label className={classes.label}>Add Message:</label>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className={classes.messageInput}
          placeholder="Type a message..."
        />
        <div className={classes.messageButtons}>
          <button onClick={() => addMessage("user")} className={classes.userButton}>
            Add as User
          </button>
          <button onClick={() => addMessage("assistant")} className={classes.assistantButton}>
            Add as Bot
          </button>
        </div>
      </div>

      <div className={classes.formGroup}>
        <label className={classes.label}>
          <input
            type="checkbox"
            checked={editedData.isTyping}
            onChange={(e) => setEditedData({ ...editedData, isTyping: e.target.checked })}
            className={classes.checkbox}
          />
          Show typing indicator
        </label>
      </div>

      <div className={classes.formGroup}>
        <label className={classes.label}>Messages: {editedData.messages.length}</label>
        <button onClick={clearMessages} className={classes.clearButton}>
          Clear All Messages
        </button>
      </div>

      <button onClick={handleSave} className={classes.saveButton}>
        Save Changes
      </button>
    </div>
  );
};

export const AIChatNodeDefinition: NodeDefinition = {
  type: "ai-chat",
  displayName: "AI Chat",
  description: "Interactive chatbot interface",
  category: "AI",
  defaultData: {
    title: "AI Chat",
  },
  defaultSize: { width: 320, height: 240 },
  ports: [
    {
      id: "prompt-input",
      type: "input",
      label: "Prompt",
      position: "left",
    },
    {
      id: "response-output",
      type: "output",
      label: "Response",
      position: "right",
    },
    {
      id: "context",
      type: "input",
      label: "Context",
      position: "top",
    },
  ],
  renderNode: AIChatRenderer,
  renderInspector: AIChatInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      id: ref.id,
      botName: "AI Assistant",
      botAvatar: "🤖",
      messages: [
        {
          role: "assistant",
          content: "Hello! How can I help you today?",
          timestamp: Date.now() - 60000,
        },
        {
          role: "user",
          content: "What's the weather like?",
          timestamp: Date.now() - 30000,
        },
        {
          role: "assistant",
          content: "I don't have access to real-time weather data, but I can help you with other questions!",
          timestamp: Date.now(),
        },
      ],
      isTyping: false,
      temperature: 0.7,
      model: "GPT-4",
    };
  },
  updateExternalData: async (_ref: ExternalDataReference, data: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("Updated AI chat data:", data);
  },
};
