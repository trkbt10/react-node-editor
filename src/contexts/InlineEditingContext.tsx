/**
 * @file Context for managing inline editing state of node titles and data
 */
import * as React from "react";

// Inline editing types
export type NodeId = string;

export type InlineEditingState = {
  editingNodeId: NodeId | null;
  editingField: 'title' | 'data' | null;
  originalValue: string;
  currentValue: string;
  isActive: boolean;
}

// Inline editing actions
export type InlineEditingAction =
  | { type: "START_EDITING"; payload: { nodeId: NodeId; field: 'title' | 'data'; value: string } }
  | { type: "UPDATE_VALUE"; payload: { value: string } }
  | { type: "CONFIRM_EDIT" }
  | { type: "CANCEL_EDIT" }
  | { type: "END_EDITING" };

// Inline editing reducer
export const inlineEditingReducer = (
  state: InlineEditingState,
  action: InlineEditingAction
): InlineEditingState => {
  switch (action.type) {
    case "START_EDITING": {
      const { nodeId, field, value } = action.payload;
      return {
        editingNodeId: nodeId,
        editingField: field,
        originalValue: value,
        currentValue: value,
        isActive: true,
      };
    }

    case "UPDATE_VALUE": {
      if (!state.isActive) {return state;}
      return {
        ...state,
        currentValue: action.payload.value,
      };
    }

    case "CONFIRM_EDIT":
    case "CANCEL_EDIT":
    case "END_EDITING": {
      return {
        editingNodeId: null,
        editingField: null,
        originalValue: "",
        currentValue: "",
        isActive: false,
      };
    }

    default:
      return state;
  }
};

// Default state
export const defaultInlineEditingState: InlineEditingState = {
  editingNodeId: null,
  editingField: null,
  originalValue: "",
  currentValue: "",
  isActive: false,
};

// Action creators
export const inlineEditingActions = {
  startEditing: (nodeId: NodeId, field: 'title' | 'data', value: string): InlineEditingAction => ({
    type: "START_EDITING",
    payload: { nodeId, field, value },
  }),
  updateValue: (value: string): InlineEditingAction => ({
    type: "UPDATE_VALUE",
    payload: { value },
  }),
  confirmEdit: (): InlineEditingAction => ({
    type: "CONFIRM_EDIT",
  }),
  cancelEdit: (): InlineEditingAction => ({
    type: "CANCEL_EDIT",
  }),
  endEditing: (): InlineEditingAction => ({
    type: "END_EDITING",
  }),
};

// Context
export type InlineEditingContextValue = {
  state: InlineEditingState;
  dispatch: React.Dispatch<InlineEditingAction>;
  actions: typeof inlineEditingActions;
  isEditing: (nodeId: NodeId, field?: 'title' | 'data') => boolean;
  startEditing: (nodeId: NodeId, field: 'title' | 'data', value: string) => void;
  updateValue: (value: string) => void;
  confirmEdit: () => void;
  cancelEdit: () => void;
}

export const InlineEditingContext = React.createContext<InlineEditingContextValue | null>(null);

// Provider
export type InlineEditingProviderProps = {
  children: React.ReactNode;
  initialState?: Partial<InlineEditingState>;
}

export const InlineEditingProvider: React.FC<InlineEditingProviderProps> = ({
  children,
  initialState,
}) => {
  const [state, dispatch] = React.useReducer(
    inlineEditingReducer,
    { ...defaultInlineEditingState, ...initialState }
  );

  // Convenience methods
  const isEditing = React.useCallback(
    (nodeId: NodeId, field?: 'title' | 'data') => {
      if (!state.isActive) {return false;}
      if (state.editingNodeId !== nodeId) {return false;}
      if (field && state.editingField !== field) {return false;}
      return true;
    },
    [state.isActive, state.editingNodeId, state.editingField]
  );

  const startEditing = React.useCallback(
    (nodeId: NodeId, field: 'title' | 'data', value: string) => {
      dispatch(inlineEditingActions.startEditing(nodeId, field, value));
    },
    [dispatch]
  );

  const updateValue = React.useCallback(
    (value: string) => {
      dispatch(inlineEditingActions.updateValue(value));
    },
    [dispatch]
  );

  const confirmEdit = React.useCallback(() => {
    dispatch(inlineEditingActions.confirmEdit());
  }, [dispatch]);

  const cancelEdit = React.useCallback(() => {
    dispatch(inlineEditingActions.cancelEdit());
  }, [dispatch]);

  const contextValue: InlineEditingContextValue = {
    state,
    dispatch,
    actions: inlineEditingActions,
    isEditing,
    startEditing,
    updateValue,
    confirmEdit,
    cancelEdit,
  };

  return (
    <InlineEditingContext.Provider value={contextValue}>
      {children}
    </InlineEditingContext.Provider>
  );
};

// Hook
export const useInlineEditing = (): InlineEditingContextValue => {
  const context = React.useContext(InlineEditingContext);
  if (!context) {
    throw new Error("useInlineEditing must be used within an InlineEditingProvider");
  }
  return context;
};