import { create } from 'zustand';
import type {
  BlockId,
  BlockStyle,
  BlockLayout,
  BlockNode,
  BlockDocument,
  ContainerBlockNode,
} from '../types';
import { BlockType } from '../types';
import type { EditorStore, SelectionState } from './types';

/**
 * 递归收集节点及其所有子节点的 ID
 */
function collectDescendantIds(
  nodeId: BlockId,
  nodes: Record<BlockId, BlockNode>,
): BlockId[] {
  const ids: BlockId[] = [nodeId];
  const node = nodes[nodeId];
  if (node && node.type === BlockType.Container) {
    for (const childId of node.props.children) {
      ids.push(...collectDescendantIds(childId, nodes));
    }
  }
  return ids;
}

/**
 * 查找节点的父节点 ID
 */
function findParentId(
  nodeId: BlockId,
  nodes: Record<BlockId, BlockNode>,
  rootId: BlockId,
): BlockId | null {
  if (nodeId === rootId) return null;
  for (const [id, node] of Object.entries(nodes)) {
    if (node.type === BlockType.Container && node.props.children.includes(nodeId)) {
      return id;
    }
  }
  return null;
}

/**
 * 安全地更新容器节点的 children，返回新的 nodes 映射
 */
function updateContainerChildren(
  nodes: Record<BlockId, BlockNode>,
  containerId: BlockId,
  updater: (children: BlockId[]) => BlockId[],
): Record<BlockId, BlockNode> {
  const container = nodes[containerId];
  if (!container || container.type !== BlockType.Container) return nodes;

  const newChildren = updater(container.props.children);
  const updatedContainer: ContainerBlockNode = {
    ...container,
    props: { ...container.props, children: newChildren },
  };

  return {
    ...nodes,
    [containerId]: updatedContainer,
  };
}

const initialSelection: SelectionState = {
  selectedIds: [],
  hoveredId: null,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  // ---- State ----
  document: null,
  selection: { ...initialSelection },
  isDragging: false,
  zoom: 1,
  initialized: false,

  // ---- Actions ----

  initDocument: (doc: BlockDocument) => {
    set({
      document: doc,
      selection: { ...initialSelection },
      isDragging: false,
      zoom: 1,
      initialized: true,
    });
  },

  addNode: (parentId: BlockId, node: BlockNode) => {
    const { document } = get();
    if (!document) return;

    const parent = document.nodes[parentId];
    if (!parent || parent.type !== BlockType.Container) return;

    // 同时添加节点并更新父节点 children（一次 set）
    const newNodes = updateContainerChildren(
      { ...document.nodes, [node.id]: node },
      parentId,
      (children) => [...children, node.id],
    );

    set({
      document: {
        ...document,
        updatedAt: new Date().toISOString(),
        nodes: newNodes,
      },
    });
  },

  removeNode: (nodeId: BlockId) => {
    const { document } = get();
    if (!document) return;

    // 不允许删除根节点
    if (nodeId === document.rootId) return;

    // 收集所有需要删除的节点 ID
    const idsToRemove = new Set(collectDescendantIds(nodeId, document.nodes));

    // 查找父节点并从 children 中移除
    const parentId = findParentId(nodeId, document.nodes, document.rootId);

    // 删除所有后代节点
    const newNodes = { ...document.nodes };
    for (const id of idsToRemove) {
      delete newNodes[id];
    }

    // 从父节点的 children 中移除
    if (parentId) {
      const updatedNodes = updateContainerChildren(
        newNodes,
        parentId,
        (children) => children.filter((id) => id !== nodeId),
      );

      // 清理选中状态
      const { selection } = get();
      const newSelectedIds = selection.selectedIds.filter((id) => !idsToRemove.has(id));

      set({
        document: {
          ...document,
          updatedAt: new Date().toISOString(),
          nodes: updatedNodes,
        },
        selection: {
          ...selection,
          selectedIds: newSelectedIds,
          hoveredId: idsToRemove.has(selection.hoveredId ?? '') ? null : selection.hoveredId,
        },
      });
    } else {
      set({
        document: {
          ...document,
          updatedAt: new Date().toISOString(),
          nodes: newNodes,
        },
      });
    }
  },

  updateNode: (nodeId: BlockId, updates: Partial<BlockNode>) => {
    const { document } = get();
    if (!document) return;

    const node = document.nodes[nodeId];
    if (!node) return;

    // 使用 Object.assign 进行浅合并，避免展开运算符导致的联合类型不兼容
    const updatedNode = Object.assign({}, node, updates) as BlockNode;

    set({
      document: {
        ...document,
        updatedAt: new Date().toISOString(),
        nodes: {
          ...document.nodes,
          [nodeId]: updatedNode,
        },
      },
    });
  },

  updateNodeStyle: (nodeId: BlockId, style: Partial<BlockStyle>) => {
    const { document } = get();
    if (!document) return;

    const node = document.nodes[nodeId];
    if (!node) return;

    set({
      document: {
        ...document,
        updatedAt: new Date().toISOString(),
        nodes: {
          ...document.nodes,
          [nodeId]: {
            ...node,
            style: { ...node.style, ...style },
          },
        },
      },
    });
  },

  updateNodeLayout: (nodeId: BlockId, layout: Partial<BlockLayout>) => {
    const { document } = get();
    if (!document) return;

    const node = document.nodes[nodeId];
    if (!node) return;

    set({
      document: {
        ...document,
        updatedAt: new Date().toISOString(),
        nodes: {
          ...document.nodes,
          [nodeId]: {
            ...node,
            layout: { ...node.layout, ...layout },
          },
        },
      },
    });
  },

  moveNode: (nodeId: BlockId, newParentId: BlockId, index?: number) => {
    const { document } = get();
    if (!document) return;
    if (nodeId === document.rootId) return;

    const node = document.nodes[nodeId];
    if (!node) return;

    const newParent = document.nodes[newParentId];
    if (!newParent || newParent.type !== BlockType.Container) return;

    // 防止将节点移动到自身的子节点中（循环引用检查）
    if (node.type === BlockType.Container) {
      const descendantIds = new Set(collectDescendantIds(nodeId, document.nodes));
      if (descendantIds.has(newParentId)) return;
    }

    // 查找旧父节点
    const oldParentId = findParentId(nodeId, document.nodes, document.rootId);

    let newNodes = { ...document.nodes };

    // 从旧父节点的 children 中移除
    if (oldParentId) {
      newNodes = updateContainerChildren(
        newNodes,
        oldParentId,
        (children) => children.filter((id) => id !== nodeId),
      );
    }

    // 添加到新父节点的 children
    newNodes = updateContainerChildren(
      newNodes,
      newParentId,
      (children) => {
        const filtered = children.filter((id) => id !== nodeId);
        const insertIndex = index !== undefined ? Math.min(index, filtered.length) : filtered.length;
        const copy = [...filtered];
        copy.splice(insertIndex, 0, nodeId);
        return copy;
      },
    );

    set({
      document: {
        ...document,
        updatedAt: new Date().toISOString(),
        nodes: newNodes,
      },
    });
  },

  selectNode: (nodeId: BlockId, multi?: boolean) => {
    const { document, selection } = get();
    if (!document || !document.nodes[nodeId]) return;

    if (multi) {
      // 多选模式：追加或移除
      const isSelected = selection.selectedIds.includes(nodeId);
      set({
        selection: {
          ...selection,
          selectedIds: isSelected
            ? selection.selectedIds.filter((id) => id !== nodeId)
            : [...selection.selectedIds, nodeId],
        },
      });
    } else {
      // 单选模式
      set({
        selection: {
          ...selection,
          selectedIds: [nodeId],
        },
      });
    }
  },

  clearSelection: () => {
    const { selection } = get();
    set({
      selection: {
        ...selection,
        selectedIds: [],
      },
    });
  },

  setHoveredNode: (nodeId: BlockId | null) => {
    const { selection } = get();
    set({
      selection: {
        ...selection,
        hoveredId: nodeId,
      },
    });
  },

  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.1, Math.min(5, zoom)) });
  },

  getNode: (nodeId: BlockId): BlockNode | undefined => {
    return get().document?.nodes[nodeId];
  },

  getDocumentSnapshot: (): BlockDocument | null => {
    return get().document;
  },
}));
