import React, { createContext, useContext, useMemo } from 'react';
import { useEditorContext } from './editor-context';
import type { BlockNode } from '@block-canvas/core';

// ---- Context ----

export interface NodeContextValue {
  node: BlockNode;
}

const NodeContext = createContext<NodeContextValue | null>(null);

// ---- Provider ----

export interface NodeProviderProps {
  nodeId: string;
  children: React.ReactNode;
}

export const NodeProvider: React.FC<NodeProviderProps> = ({
  nodeId,
  children,
}) => {
  const { store } = useEditorContext();
  const document = store((s) => s.document);

  const node = document?.nodes[nodeId];

  const contextValue = useMemo<NodeContextValue | null>(
    () => (node ? { node } : null),
    [node],
  );

  if (!contextValue) {
    return null;
  }

  return React.createElement(
    NodeContext.Provider,
    { value: contextValue },
    children,
  );
};

// ---- Hook ----

export function useNodeContext(): NodeContextValue {
  const ctx = useContext(NodeContext);
  if (!ctx) {
    throw new Error(
      '[NodeProvider] useNodeContext must be used within a <NodeProvider>',
    );
  }
  return ctx;
}
