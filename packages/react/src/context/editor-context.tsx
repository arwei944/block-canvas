import React, { createContext, useContext, useMemo, useRef } from 'react';
import {
  useEditorStore,
  CommandManager,
  createBuiltinCommands,
} from '@block-canvas/core';
import type { EditorStoreHook } from '@block-canvas/core';

// ---- Context ----

export interface EditorContextValue {
  store: EditorStoreHook;
  commandManager: CommandManager;
}

const EditorContext = createContext<EditorContextValue | null>(null);

// ---- Provider ----

export interface EditorProviderProps {
  children: React.ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children }) => {
  // 使用 ref 持有 store 引用，CommandManager 通过闭包惰性获取
  const storeRef = useRef(useEditorStore.getState());
  storeRef.current = useEditorStore.getState();

  const commandManager = useMemo(() => {
    const manager = new CommandManager();
    const builtinCommands = createBuiltinCommands(() => storeRef.current);
    manager.registerAll(builtinCommands);
    return manager;
  }, []);

  const contextValue = useMemo<EditorContextValue>(
    () => ({
      store: useEditorStore,
      commandManager,
    }),
    [commandManager],
  );

  return React.createElement(
    EditorContext.Provider,
    { value: contextValue },
    children,
  );
};

// ---- Hook ----

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error(
      '[EditorProvider] useEditorContext must be used within an <EditorProvider>',
    );
  }
  return ctx;
}
