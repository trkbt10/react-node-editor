/**
 * Example of extending NodeDataTypeMap for type-safe node definitions
 * 
 * Users should create a similar file in their application to define
 * their custom node types. This file serves as an example.
 */

// Import the module to extend
import "@tanuki-ui/node-editor";

// Extend the NodeDataTypeMap interface
declare module "@tanuki-ui/node-editor" {
  type NodeDataTypeMap = {
    // Standard nodes (these could be built-in nodes)
    "standard": {
      title: string;
      content: string;
    };
    
    "group": {
      title: string;
    };
    
    "multi-input": {
      title: string;
      content: string;
    };
    
    // Example custom nodes
    "custom-card": {
      title: string;
      description: string;
      icon?: string;
      status?: "active" | "inactive" | "pending";
    };
    
    "data-processor": {
      processorType: "filter" | "transform" | "aggregate";
      configuration: Record<string, unknown>;
      inputCount: number;
      outputCount: number;
    };
    
    "visualization": {
      chartType: "line" | "bar" | "pie" | "scatter";
      title: string;
      data?: unknown;
      options?: Record<string, unknown>;
    };
  }
}

// Export empty object to make this a module
export {};