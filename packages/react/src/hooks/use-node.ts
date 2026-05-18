import { useCallback, useMemo } from 'react';
import { useEditorContext } from '../context/editor-context';
import type {
  BlockId,
  BlockNode,
  BlockStyle,
  BlockLayout,
} from '@block-canvas/core';

/**
 * useNode - 获取单个节点的数据和操作
 */
export function useNode(nodeId: BlockId) {
  const { store } = useEditorContext();

  // 节点数据 — 通过 JSON 序列化实现值比较，避免引用变化导致无限循环
  const nodeJson: string | null = store(
    (s) => {
      const n = s.document?.nodes[nodeId];
      return n ? JSON.stringify(n) : null;
    },
  );

  const node: BlockNode | undefined = useMemo(
    () => (nodeJson ? (JSON.parse(nodeJson) as BlockNode) : undefined),
    [nodeJson],
  );

  // 选中/悬停状态 — 通过 JSON 序列化实现值比较
  const selectionJson: string = store(
    (s) => JSON.stringify(s.selection),
  );

  const { isSelected, isHovered } = useMemo(() => {
    const sel = JSON.parse(selectionJson);
    return {
      isSelected: (sel.selectedIds as BlockId[]).includes(nodeId),
      isHovered: sel.hoveredId === nodeId,
    };
  }, [selectionJson, nodeId]);

  const updateData = useCallback(
    (updates: Partial<BlockNode>) => {
      store.getState().updateNode(nodeId, updates);
    },
    [store, nodeId],
  );

  const updateStyle = useCallback(
    (style: Partial<BlockStyle>) => {
      store.getState().updateNodeStyle(nodeId, style);
    },
    [store, nodeId],
  );

  const updateLayout = useCallback(
    (layout: Partial<BlockLayout>) => {
      store.getState().updateNodeLayout(nodeId, layout);
    },
    [store, nodeId],
  );

  return {
    node,
    isSelected,
    isHovered,
    updateData,
    updateStyle,
    updateLayout,
  };
}
