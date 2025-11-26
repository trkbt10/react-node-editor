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

// Context types
export type InlineEditingActionsValue = {
  dispatch: React.Dispatch<InlineEditingAction>;
  actions: BoundActionCreators<typeof inlineEditingActions>;
  actionCreators: typeof inlineEditingActions;
  isEditing: (nodeId: NodeId, field?: "title" | "data") => boolean;
  startEditing: (nodeId: NodeId, field: "title" | "data", value: string) => void;
  updateValue: (value: string) => void;
  confirmEdit: () => void;
  cancelEdit: () => void;
};

export type InlineEditingContextValue = InlineEditingActionsValue & {
  state: InlineEditingState;
};

// Split contexts for performance optimization
const InlineEditingStateContext = React.createContext<InlineEditingState | null>(null);
InlineEditingStateContext.displayName = "InlineEditingStateContext";

const InlineEditingActionsContext = React.createContext<InlineEditingActionsValue | null>(null);
InlineEditingActionsContext.displayName = "InlineEditingActionsContext";

// Combined context for backward compatibility
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

  // Use ref to provide stable isEditing function that always reads latest state
  const stateRef = React.useRef(state);
  stateRef.current = state;

  // Stable actions value - only depends on dispatch which is stable
  const actionsValue = React.useMemo<InlineEditingActionsValue>(() => {
    const isEditing = (nodeId: NodeId, field?: "title" | "data"): boolean => {
      const currentState = stateRef.current;
      if (!currentState.isActive) {
        return false;
      }
      if (currentState.editingNodeId !== nodeId) {
        return false;
      }
      if (field && currentState.editingField !== field) {
        return false;
      }
      return true;
    };

    return {
      dispatch,
      actions: boundActions,
      actionCreators: inlineEditingActions,
      isEditing,
      startEditing: boundActions.startEditing,
      updateValue: boundActions.updateValue,
      confirmEdit: boundActions.confirmEdit,
      cancelEdit: boundActions.cancelEdit,
    };
  }, [dispatch, boundActions]);

  // Combined context value for backward compatibility
  const contextValue = React.useMemo<InlineEditingContextValue>(
    () => ({
      state,
      ...actionsValue,
    }),
    [state, actionsValue],
  );

  return (
    <InlineEditingStateContext.Provider value={state}>
      <InlineEditingActionsContext.Provider value={actionsValue}>
        <InlineEditingContext.Provider value={contextValue}>{children}</InlineEditingContext.Provider>
      </InlineEditingActionsContext.Provider>
    </InlineEditingStateContext.Provider>
  );
};

// Hooks

/**
 * Hook to access only the inline editing state
 * Use this when you only need to read state and don't need actions
 */
export const useInlineEditingState = (): InlineEditingState => {
  const state = React.useContext(InlineEditingStateContext);
  if (!state) {
    throw new Error("useInlineEditingState must be used within an InlineEditingProvider");
  }
  return state;
};

/**
 * Hook to access only the inline editing actions
 * Use this when you only need to dispatch actions and don't need to re-render on state changes
 * The returned actions have stable references and won't cause re-renders
 */
export const useInlineEditingActions = (): InlineEditingActionsValue => {
  const actions = React.useContext(InlineEditingActionsContext);
  if (!actions) {
    throw new Error("useInlineEditingActions must be used within an InlineEditingProvider");
  }
  return actions;
};

/**
 * Hook to access both state and actions (backward compatible)
 * Prefer useInlineEditingState or useInlineEditingActions for better performance
 */
export const useInlineEditing = (): InlineEditingContextValue => {
  const context = React.useContext(InlineEditingContext);
  if (!context) {
    throw new Error("useInlineEditing must be used within an InlineEditingProvider");
  }
  return context;
};
