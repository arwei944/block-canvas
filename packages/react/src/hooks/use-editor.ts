import { useCallback, useMemo } from 'react';
import { useEditorContext } from '../context/editor-context';
import type {
  BlockId,
  BlockNode,
  BlockStyle,
  BlockLayout,
  BlockDocument,
} from '@block-canvas/core';
import type { CommandParams } from '@block-canvas/core';

/**
 * useEditor - 封装常用的编辑器状态和操作
 *
 * 所有对象/数组状态通过 JSON 序列化实现值比较，避免引用变化导致无限重渲染
 */
export function useEditor() {
  const { store, commandManager } = useEditorContext();

  // ---- 状态（通过 JSON 序列化实现值比较） ----
  const documentJson: string | null = store(
    (s) => (s.document ? JSON.stringify(s.document) : null),
  );
  const document: BlockDocument | null = useMemo(
    () => (documentJson ? (JSON.parse(documentJson) as BlockDocument) : null),
    [documentJson],
  );

  const selectionJson: string = store((s) => JSON.stringify(s.selection));
  const selection = useMemo(
    () => JSON.parse(selectionJson),
    [selectionJson],
  );

  const zoom: number = store((s) => s.zoom);
  const isDragging: boolean = store((s) => s.isDragging);
  const initialized: boolean = store((s) => s.initialized);

  // ---- 节点操作 ----
  const addNode = useCallback(
    (parentId: BlockId, node: BlockNode) => {
      store.getState().addNode(parentId, node);
    },
    [store],
  );

  const removeNode = useCallback(
    (nodeId: BlockId) => {
      store.getState().removeNode(nodeId);
    },
    [store],
  );

  const updateNode = useCallback(
    (nodeId: BlockId, updates: Partial<BlockNode>) => {
      store.getState().updateNode(nodeId, updates);
    },
    [store],
  );

  const updateNodeStyle = useCallback(
    (nodeId: BlockId, style: Partial<BlockStyle>) => {
      store.getState().updateNodeStyle(nodeId, style);
    },
    [store],
  );

  const updateNodeLayout = useCallback(
    (nodeId: BlockId, layout: Partial<BlockLayout>) => {
      store.getState().updateNodeLayout(nodeId, layout);
    },
    [store],
  );

  const moveNode = useCallback(
    (nodeId: BlockId, newParentId: BlockId, index?: number) => {
      store.getState().moveNode(nodeId, newParentId, index);
    },
    [store],
  );

  // ---- 选择操作 ----
  const selectNode = useCallback(
    (nodeId: BlockId, multi?: boolean) => {
      store.getState().selectNode(nodeId, multi);
    },
    [store],
  );

  const clearSelection = useCallback(() => {
    store.getState().clearSelection();
  }, [store]);

  const setHoveredNode = useCallback(
    (nodeId: BlockId | null) => {
      store.getState().setHoveredNode(nodeId);
    },
    [store],
  );

  // ---- 缩放 ----
  const setZoom = useCallback(
    (z: number) => {
      store.getState().setZoom(z);
    },
    [store],
  );

  // ---- 查询 ----
  const getNode = useCallback(
    (nodeId: BlockId): BlockNode | undefined => {
      return store.getState().getNode(nodeId);
    },
    [store],
  );

  const getDocumentSnapshot = useCallback((): BlockDocument | null => {
    return store.getState().getDocumentSnapshot();
  }, [store]);

  // ---- 命令 ----
  const executeCommand = useCallback(
    (name: string, params: CommandParams) => {
      commandManager.execute(name, params);
    },
    [commandManager],
  );

  // ---- 历史 ----
  const undo = useCallback(() => {
    commandManager.undo();
  }, [commandManager]);

  const redo = useCallback(() => {
    commandManager.redo();
  }, [commandManager]);

  const canUndo = commandManager.canUndo();
  const canRedo = commandManager.canRedo();

  return {
    // 状态
    document,
    selection,
    selectedIds: selection?.selectedIds || [],
    zoom,
    isDragging,
    initialized,

    // 节点操作
    addNode,
    removeNode,
    updateNode,
    updateNodeStyle,
    updateNodeLayout,
    moveNode,

    // 选择
    selectNode,
    clearSelection,
    setHoveredNode,

    // 缩放
    setZoom,

    // 查询
    getNode,
    getDocumentSnapshot,

    // 命令
    executeCommand,

    // 历史
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
