# Migration Guide: Enhanced NodeRenderProps with Optional Generics

This guide helps you migrate to the new type-safe node system while maintaining backward compatibility.

## Overview

The enhanced NodeRenderProps system adds optional generic type parameters that provide compile-time type safety for node data. The system is fully backward compatible - existing code will continue to work without modifications.

## Benefits

- **Type Safety**: Get compile-time checks and IntelliSense for node data
- **Better Developer Experience**: Auto-completion for node properties
- **Gradual Migration**: Update nodes one at a time
- **Zero Breaking Changes**: Existing code continues to work

## Basic Migration Steps

### 1. Define Your Node Data Types

Extend the `NodeDataTypeMap` interface to register your node types:

```typescript
// In your types file or at the top of your node definitions
declare module '@tanuki-ui/node-editor' {
  interface NodeDataTypeMap {
    'my-custom-node': {
      title: string;
      value: number;
      enabled: boolean;
    };
  }
}
```

### 2. Update Node Renderer Components

Add the type parameter to your renderer components:

**Before:**
```typescript
const MyNodeRenderer: React.FC<NodeRenderProps> = ({ node, isSelected }) => {
  const title = node.data.title as string;
  const value = node.data.value as number;
  // ...
};
```

**After:**
```typescript
const MyNodeRenderer: React.FC<NodeRenderProps<"my-custom-node">> = ({ node, isSelected }) => {
  // node.data is now typed - no casting needed!
  const { title, value, enabled } = node.data;
  // ...
};
```

### 3. Use Helper Functions

Use the provided helper functions for type-safe operations:

```typescript
import { createNodeDefinition, createNodeDataUpdater } from '@tanuki-ui/node-editor';

const MyNodeRenderer: React.FC<NodeRenderProps<"my-custom-node">> = ({ 
  node, 
  onUpdateNode 
}) => {
  const updateData = createNodeDataUpdater<"my-custom-node">(onUpdateNode);
  
  const handleToggle = () => {
    // Type-safe update - only valid properties allowed
    updateData({ enabled: !node.data.enabled });
  };
  
  // ...
};
```

### 4. Create Type-Safe Node Definitions

```typescript
export const MyNodeDefinition = createNodeDefinition({
  type: "my-custom-node",
  displayName: "My Custom Node",
  defaultData: {
    title: "New Node",
    value: 0,
    enabled: true,
  },
  renderNode: MyNodeRenderer,
  renderInspector: MyNodeInspector,
});
```

## Gradual Migration Strategy

You don't need to migrate all nodes at once. Here's a recommended approach:

1. **Start with new nodes**: Use the type system for any new nodes you create
2. **Migrate high-value nodes**: Update complex nodes that would benefit most from type safety
3. **Update as you go**: When you need to modify an existing node, add types at that time
4. **Keep legacy nodes**: Simple nodes can remain untyped indefinitely

## Compatibility Bridges

If you need to use typed components with legacy APIs:

```typescript
import { asOriginalNodeRender, asOriginalInspectorRender } from '@tanuki-ui/node-editor';

// Convert typed renderer to legacy interface
const legacyRender = asOriginalNodeRender(MyTypedNodeRenderer);
const legacyInspector = asOriginalInspectorRender(MyTypedInspector);
```

## Common Patterns

### Pattern 1: Shared Node Data Types

```typescript
// Define common data shapes
interface BaseNodeData {
  title: string;
  description?: string;
}

interface NumericNodeData extends BaseNodeData {
  value: number;
  min?: number;
  max?: number;
}

// Register multiple nodes with shared types
declare module '@tanuki-ui/node-editor' {
  interface NodeDataTypeMap {
    'slider-node': NumericNodeData;
    'gauge-node': NumericNodeData;
    'counter-node': NumericNodeData & { step: number };
  }
}
```

### Pattern 2: Generic Node Components

```typescript
// Create a generic renderer for similar nodes
function createNumericNodeRenderer<T extends keyof NodeDataTypeMap>(
  nodeType: T
): React.FC<NodeRenderProps<T>> {
  return ({ node, onUpdateNode }) => {
    // Implementation
  };
}

// Use for multiple node types
const SliderRenderer = createNumericNodeRenderer('slider-node');
const GaugeRenderer = createNumericNodeRenderer('gauge-node');
```

### Pattern 3: Type Guards

```typescript
// Type guard for runtime checks
function isMyCustomNode(node: Node): node is Node & { type: 'my-custom-node' } {
  return node.type === 'my-custom-node';
}

// Use in mixed contexts
if (isMyCustomNode(node)) {
  // node.data is typed here
  console.log(node.data.title);
}
```

## Troubleshooting

### Issue: Type errors after adding generics

Make sure you've properly declared the type in `NodeDataTypeMap`:

```typescript
declare module '@tanuki-ui/node-editor' {
  interface NodeDataTypeMap {
    'your-node-type': YourDataInterface;
  }
}
```

### Issue: Cannot import types

Ensure you're importing from the correct path:

```typescript
import type { NodeDataTypeMap, NodeRenderProps } from '@tanuki-ui/node-editor';
```

### Issue: Legacy nodes showing type errors

For nodes you haven't migrated yet, you can use type assertions:

```typescript
const definition = createNodeDefinition({
  type: 'legacy-node' as any,
  // ... rest of definition
});
```

## Best Practices

1. **Use specific types**: Avoid `any` or overly generic types
2. **Document your types**: Add JSDoc comments to your data interfaces
3. **Validate at runtime**: Types don't guarantee runtime safety - validate external data
4. **Share type definitions**: Export your node data types for reuse
5. **Incremental adoption**: Don't feel pressured to migrate everything at once

## Examples

See `/src/extended/node-editor/examples/typedNodes.example.tsx` for complete examples of:
- Basic typed nodes
- Inspector integration  
- Helper function usage
- Legacy compatibility