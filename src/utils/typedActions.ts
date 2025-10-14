/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @file Utilities for defining typed action creators and reducer handler maps without external dependencies.
 */

export type AnyAction = { type: string };

export type AnyActionCreator = {
  (...args: any[]): AnyAction;
  readonly type: string;
};

type PayloadCreator = (...args: any[]) => any;

type ActionFromPayload<Type extends string, Creator extends PayloadCreator> = ReturnType<Creator> extends undefined | void
  ? { type: Type }
  : { type: Type; payload: Exclude<ReturnType<Creator>, undefined> };

/**
 * Creates a typed action creator with an attached literal `type` property.
 */
export function createAction<Type extends string>(type: Type): (() => { type: Type }) & { readonly type: Type };
export function createAction<Type extends string, Creator extends PayloadCreator>(
  type: Type,
  payloadCreator: Creator,
): ((...args: Parameters<Creator>) => ActionFromPayload<Type, Creator>) & { readonly type: Type };
export function createAction<Type extends string, Creator extends PayloadCreator>(
  type: Type,
  payloadCreator?: Creator,
) {
  if (!payloadCreator) {
    const actionCreator = (() => ({ type } as const)) as (() => { type: Type }) & { readonly type: Type };
    Object.defineProperty(actionCreator, "type", {
      value: type,
      writable: false,
      enumerable: true,
    });
    return actionCreator;
  }
  const actionCreator = ((...args: Parameters<Creator>) => {
    const payload = payloadCreator(...args);
    if (typeof payload === "undefined") {
      return { type } as const;
    }
    return { type, payload } as const;
  }) as ((...args: Parameters<Creator>) => ActionFromPayload<Type, Creator>) & { readonly type: Type };
  Object.defineProperty(actionCreator, "type", {
    value: type,
    writable: false,
    enumerable: true,
  });
  return actionCreator;
}

export type ActionCreatorsMap = Record<string, AnyActionCreator>;

export type ActionUnion<Creators extends ActionCreatorsMap> = ReturnType<Creators[keyof Creators]>;

export type CaseReducer<State, Action extends AnyAction, Extra> = (state: State, action: Action, extra: Extra) => State;

export type BoundActionCreators<Creators extends ActionCreatorsMap> = {
  [Key in keyof Creators]: (...args: Parameters<Creators[Key]>) => ReturnType<Creators[Key]>;
};

export const bindActionCreators = <Creators extends ActionCreatorsMap>(
  creators: Creators,
  dispatch: (action: ActionUnion<Creators>) => unknown,
): BoundActionCreators<Creators> => {
  const bound = {} as BoundActionCreators<Creators>;
  (Object.keys(creators) as Array<keyof Creators>).forEach((key) => {
    const creator = creators[key];
    bound[key] = ((...args: Parameters<typeof creator>) => {
      const action = creator(...args);
      dispatch(action as ActionUnion<Creators>);
      return action;
    }) as BoundActionCreators<Creators>[keyof Creators];
  });
  return bound;
};

export const createActionHandlerMap = <
  State,
  Creators extends ActionCreatorsMap,
  Extra = undefined,
>(
  creators: Creators,
  handlers: {
    [Key in keyof Creators]?: CaseReducer<State, ReturnType<Creators[Key]>, Extra>;
  },
): Record<string, CaseReducer<State, ReturnType<Creators[keyof Creators]>, Extra>> => {
  const map: Record<string, CaseReducer<State, ReturnType<Creators[keyof Creators]>, Extra>> = {};

  (Object.keys(handlers) as Array<keyof Creators>).forEach((key) => {
    const handler = handlers[key];
    if (!handler) {
      return;
    }
    const creator = creators[key];
    if (!creator) {
      throw new Error(`Missing action creator for key "${String(key)}"`);
    }
    map[creator.type] = handler as CaseReducer<State, ReturnType<Creators[keyof Creators]>, Extra>;
  });

  return map;
};
