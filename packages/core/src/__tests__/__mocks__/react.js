// Mock React for zustand in node environment
// zustand v5 react bindings require React, but we're in a node test environment
export const useCallback = (fn: any) => fn;
export const useMemo = (fn: any) => fn();
export const useEffect = () => {};
export const useRef = (initial: any) => ({ current: initial });
export const useState = (initial: any) => [initial, () => {}];
export const useReducer = (reducer: any, initial: any) => [initial, () => {}];
export const createContext = (defaultValue: any) => ({
  Provider: ({ children }: any) => children,
  Consumer: ({ children }: any) => children(defaultValue),
  _defaultValue: defaultValue,
});
export const createElement = () => {};
export default {
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
  useReducer,
  createContext,
  createElement,
};
