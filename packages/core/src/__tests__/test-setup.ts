import { beforeEach, vi } from 'vitest';

// Mock React for zustand in node environment
vi.mock('react', () => ({
  default: {
    useCallback: (fn: any) => fn,
    useMemo: (fn: any) => fn(),
    useEffect: () => {},
    useRef: (initial: any) => ({ current: initial }),
    useState: (initial: any) => [initial, () => {}],
    useReducer: (reducer: any, initial: any) => [initial, () => {}],
    createContext: (defaultValue: any) => ({
      Provider: ({ children }: any) => children,
      Consumer: ({ children }: any) => children(defaultValue),
      _defaultValue: defaultValue,
    }),
    createElement: () => {},
    useSyncExternalStore: (subscribe: any, getSnapshot: any, getServerSnapshot?: any) => getSnapshot(),
    useDebugValue: () => {},
  },
  useCallback: (fn: any) => fn,
  useMemo: (fn: any) => fn(),
  useEffect: () => {},
  useRef: (initial: any) => ({ current: initial }),
  useState: (initial: any) => [initial, () => {}],
  useReducer: (reducer: any, initial: any) => [initial, () => {}],
  createContext: (defaultValue: any) => ({
    Provider: ({ children }: any) => children,
    Consumer: ({ children }: any) => children(defaultValue),
    _defaultValue: defaultValue,
  }),
  createElement: () => {},
  useSyncExternalStore: (subscribe: any, getSnapshot: any, getServerSnapshot?: any) => getSnapshot(),
  useDebugValue: () => {},
}));

vi.mock('react-dom', () => ({
  default: {},
}));

vi.mock('react-dom/client', () => ({
  default: {},
}));

// Reset zustand store state between tests
beforeEach(() => {
  vi.clearAllMocks();
});
