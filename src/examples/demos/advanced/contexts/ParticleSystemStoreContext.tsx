import * as React from "react";
import type { ParticleData, ParticleSystemDataStore } from "../nodes/ParticleSystemDataStore";
import { getLocalStoreAdapter, getLocalStoreEntries, registerParticleSystemDataStore } from "../nodes/ParticleSystemDataStore";

const ParticleSystemStoreContext = React.createContext<ParticleSystemDataStore>(getLocalStoreAdapter());

export const ParticleSystemStoreProvider: React.FC<{ children: React.ReactNode; initialValues?: Record<string, ParticleData> }> = ({
  children,
  initialValues = {},
}) => {
  const initialEntries = React.useMemo(() => {
    const entries = getLocalStoreEntries();
    Object.entries(initialValues).forEach(([id, value]) => {
      entries.push([id, value]);
    });
    return entries;
  }, [initialValues]);

  const storeRef = React.useRef<Map<string, ParticleData>>(new Map(initialEntries));
  const [version, forceRender] = React.useReducer((count) => count + 1, 0);

  const getData = React.useCallback((id: string) => storeRef.current.get(id), []);

  const setData = React.useCallback(
    (id: string, data: ParticleData) => {
      storeRef.current.set(id, data);
      forceRender();
      return data;
    },
    [],
  );

  const updateData = React.useCallback(
    (id: string, updater: (current: ParticleData | undefined) => ParticleData) => {
      const next = updater(storeRef.current.get(id));
      storeRef.current.set(id, next);
      forceRender();
      return next;
    },
    [],
  );

  const store = React.useMemo<ParticleSystemDataStore>(
    () => ({
      getData,
      setData,
      updateData,
    }),
    [getData, setData, updateData, version],
  );

  React.useEffect(() => {
    registerParticleSystemDataStore(store);
    return () => registerParticleSystemDataStore(null);
  }, [store]);

  return <ParticleSystemStoreContext.Provider value={store}>{children}</ParticleSystemStoreContext.Provider>;
};

export const useParticleSystemStore = (): ParticleSystemDataStore => React.useContext(ParticleSystemStoreContext);
