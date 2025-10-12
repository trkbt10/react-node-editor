/**
 * @file Particle system store context - scoped state container for particle configuration data
 */
import * as React from "react";
import type { ParticleData } from "../nodes/ParticleSystemDataStore";

export type ParticleSystemDataStore = {
  getData: (refId: string) => ParticleData | undefined;
  setData: (refId: string, data: ParticleData) => ParticleData;
  updateData: (refId: string, updater: (current: ParticleData | undefined) => ParticleData) => ParticleData;
};

type ParticleSystemState = Record<string, ParticleData>;

type ParticleSystemAction =
  | { type: "set"; id: string; data: ParticleData }
  | { type: "merge"; values: Record<string, ParticleData> };

const particleSystemReducer = (state: ParticleSystemState, action: ParticleSystemAction): ParticleSystemState => {
  switch (action.type) {
    case "set": {
      const existing = state[action.id];
      if (existing === action.data) {
        return state;
      }
      return {
        ...state,
        [action.id]: action.data,
      };
    }
    case "merge": {
      if (Object.keys(action.values).length === 0) {
        return state;
      }
      return {
        ...state,
        ...action.values,
      };
    }
    default:
      return state;
  }
};

const ParticleSystemStoreContext = React.createContext<ParticleSystemDataStore | null>(null);

export const ParticleSystemStoreProvider: React.FC<{
  children: React.ReactNode;
  initialValues?: Record<string, ParticleData>;
}> = ({ children, initialValues = {} }) => {
  const [state, dispatch] = React.useReducer(particleSystemReducer, initialValues);

  // Merge new initial values when they change (e.g., hot reload in examples)
  React.useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      dispatch({ type: "merge", values: initialValues });
    }
  }, [initialValues]);

  const getData = React.useCallback((id: string) => state[id], [state]);

  const setData = React.useCallback((id: string, data: ParticleData) => {
    dispatch({ type: "set", id, data });
    return data;
  }, []);

  const updateData = React.useCallback(
    (id: string, updater: (current: ParticleData | undefined) => ParticleData) => {
      const next = updater(state[id]);
      dispatch({ type: "set", id, data: next });
      return next;
    },
    [state],
  );

  const store = React.useMemo<ParticleSystemDataStore>(
    () => ({
      getData,
      setData,
      updateData,
    }),
    [getData, setData, updateData],
  );

  return <ParticleSystemStoreContext.Provider value={store}>{children}</ParticleSystemStoreContext.Provider>;
};

export const useParticleSystemStore = (): ParticleSystemDataStore => {
  const context = React.useContext(ParticleSystemStoreContext);
  if (!context) {
    throw new Error("useParticleSystemStore must be used within a ParticleSystemStoreProvider");
  }
  return context;
};
