/**
 * @file Context for managing inline editing state of node titles and data
 */
import * as React from "react";
import { bindActionCreators, createAction, createActionHandlerMap, type ActionUnion, type BoundActionCreators } from "../utils/typedActions";

// Inline editing types
export type NodeId = string;

export type InlineEditingState = {
  editingNodeId: NodeId | null;
  editingField: "title" | "data" | null;
  originalValue: string;
  currentValue: string;
  isActive: boolean;
};

export const inlineEditingActions = {
  startEditing: createAction("START_EDITING", (nodeId: NodeId, field: "title" | "data", value: string) => ({
    nodeId,
    field,
    value,
  })),
  updateValue: createAction("UPDATE_VALUE", (value: string) => ({ value })),
  confirmEdit: createAction("CONFIRM_EDIT"),
  cancelEdit: createAction("CANCEL_EDIT"),
  endEditing: createAction("END_EDITING"),
} as const;

export type InlineEditingAction = ActionUnion<typeof inlineEditingActions>;

// Default state
export const defaultInlineEditingState: InlineEditingState = {
  editingNodeId: null,
  editingField: null,
  originalValue: "",
  currentValue: "",
  isActive: false,
};

const inlineEditingHandlers = createActionHandlerMap<InlineEditingState, typeof inlineEditingActions>(
  inlineEditingActions,
  {
    startEditing: (_state, action) => {
      const { nodeId, field, value } = action.payload;
      return {
        editingNodeId: nodeId,
        editingField: field,
        originalValue: value,
        currentValue: value,
        isActive: true,
      };
    },
    updateValue: (state, action) => {
      if (!state.isActive) {
        return state;
      }
      return {
        ...state,
        currentValue: action.payload.value,
      };
    },
    confirmEdit: () => ({ ...defaultInlineEditingState }),
    cancelEdit: () => ({ ...defaultInlineEditingState }),
    endEditing: () => ({ ...defaultInlineEditingState }),
  },
);

// Inline editing reducer
export const inlineEditingReducer = (state: InlineEditingState, action: InlineEditingAction): InlineEditingState => {
  const handler = inlineEditingHandlers[action.type];
  if (!handler) {
    return state;
  }
  return handler(state, action, undefined);
};

// Context
export type InlineEditingContextValue = {
  state: InlineEditingState;
  dispatch: React.Dispatch<InlineEditingAction>;
  actions: BoundActionCreators<typeof inlineEditingActions>;
  actionCreators: typeof inlineEditingActions;
  isEditing: (nodeId: NodeId, field?: "title" | "data") => boolean;
  startEditing: (nodeId: NodeId, field: "title" | "data", value: string) => void;
  updateValue: (value: string) => void;
  confirmEdit: () => void;
  cancelEdit: () => void;
};

export const InlineEditingContext = React.createContext<InlineEditingContextValue | null>(null);
InlineEditingContext.displayName = "InlineEditingContext";

// Provider
export type InlineEditingProviderProps = {
  children: React.ReactNode;
  initialState?: Partial<InlineEditingState>;
};

export const InlineEditingProvider: React.FC<InlineEditingProviderProps> = ({ children, initialState }) => {
  const [state, dispatch] = React.useReducer(inlineEditingReducer, { ...defaultInlineEditingState, ...initialState });
  const boundActions = React.useMemo(() => bindActionCreators(inlineEditingActions, dispatch), [dispatch]);

  // Convenience methods
  const isEditing = React.useCallback(
    (nodeId: NodeId, field?: "title" | "data") => {
      if (!state.isActive) {
        return false;
      }
      if (state.editingNodeId !== nodeId) {
        return false;
      }
      if (field && state.editingField !== field) {
        return false;
      }
      return true;
    },
    [state.isActive, state.editingNodeId, state.editingField],
  );

  const startEditing = React.useCallback(
    (nodeId: NodeId, field: "title" | "data", value: string) => {
      boundActions.startEditing(nodeId, field, value);
    },
    [boundActions],
  );

  const updateValue = React.useCallback(
    (value: string) => {
      boundActions.updateValue(value);
    },
    [boundActions],
  );

  const confirmEdit = React.useCallback(() => {
    boundActions.confirmEdit();
  }, [boundActions]);

  const cancelEdit = React.useCallback(() => {
    boundActions.cancelEdit();
  }, [boundActions]);

  const contextValue: InlineEditingContextValue = React.useMemo(
    () => ({
      state,
      dispatch,
      actions: boundActions,
      actionCreators: inlineEditingActions,
      isEditing,
      startEditing,
      updateValue,
      confirmEdit,
      cancelEdit,
    }),
    [state, dispatch, boundActions, isEditing, startEditing, updateValue, confirmEdit, cancelEdit],
  );

  return <InlineEditingContext.Provider value={contextValue}>{children}</InlineEditingContext.Provider>;
};

// Hook
export const useInlineEditing = (): InlineEditingContextValue => {
  const context = React.useContext(InlineEditingContext);
  if (!context) {
    throw new Error("useInlineEditing must be used within an InlineEditingProvider");
  }
  return context;
};
