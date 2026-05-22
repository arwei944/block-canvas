import type { BlockId, BlockStyle, BlockLayout, BlockNode, BlockDocument } from '../types';
import type { UseBoundStore, StoreApi } from 'zustand';

export interface SelectionState {
  selectedIds: BlockId[];
  hoveredId: BlockId | null;
}

export interface EditorState {
  document: BlockDocument | null;
  selection: SelectionState;
  isDragging: boolean;
  zoom: number;
  initialized: boolean;
}

export interface EditorActions {
  initDocument: (doc: BlockDocument) => void;
  addNode: (parentId: BlockId, node: BlockNode) => void;
  removeNode: (nodeId: BlockId) => void;
  updateNode: (nodeId: BlockId, updates: Partial<BlockNode>) => void;
  updateNodeStyle: (nodeId: BlockId, style: Partial<BlockStyle>) => void;
  updateNodeLayout: (nodeId: BlockId, layout: Partial<BlockLayout>) => void;
  moveNode: (nodeId: BlockId, newParentId: BlockId, index?: number) => void;
  selectNode: (nodeId: BlockId, multi?: boolean) => void;
  clearSelection: () => void;
  setHoveredNode: (nodeId: BlockId | null) => void;
  setZoom: (zoom: number) => void;
  getNode: (nodeId: BlockId) => BlockNode | undefined;
  getDocumentSnapshot: () => BlockDocument | null;
}

export type EditorStore = EditorState & EditorActions;

/** zustand hook 类型：useEditorStore(selector) */
export type EditorStoreHook = UseBoundStore<StoreApi<EditorStore>>;

/** zustand StoreApi 类型：用于 context 中传递 store 实例 */
export type EditorStoreApi = StoreApi<EditorStore>;
