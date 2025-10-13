/**
 * @file React hook that wraps an async function with loading and error state.
 */
import React from "react";

export type AsyncState<T extends Promise<unknown>> = {
  loading: boolean;
  error?: unknown;
  value?: T;
};
export const useAsyncFn = <
  Fn extends (...args: unknown[]) => Promise<unknown>,
  State extends Awaited<ReturnType<Fn>> = Awaited<ReturnType<Fn>>,
>(
  fn: Fn,
  deps: unknown[],
) => {
  const fnRef = React.useRef(fn);
  fnRef.current = fn;
  const [state, setState] = React.useState<AsyncState<ReturnType<Fn>>>({
    loading: false,
  });
  const call = React.useCallback(
    async (...args: Parameters<Fn>): Promise<ReturnType<Fn>> => {
      setState((prev) => ({ ...prev, loading: true }));
      const promise = fnRef.current(...args) as ReturnType<Fn>;
      const value = await promise;
      try {
        setState({ loading: false, value, error: null });
        return value;
      } catch (error) {
        setState({ loading: false, error: error });
        throw error;
      }
    },
    [...deps],
  );

  return [state, call] as [State, Fn];
};
