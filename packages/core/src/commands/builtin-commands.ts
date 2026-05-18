import type { BlockId, BlockNode, BlockStyle, BlockLayout } from '../types';
import { BlockType } from '../types';
import type { EditorStore } from '../store';
import type {
  Command,
  CommandParams,
  AddNodeParams,
  RemoveNodeParams,
  UpdateNodeParams,
  UpdateStyleParams,
  UpdateLayoutParams,
  MoveNodeParams,
} from './types';

/**
 * 在 nodes 映射中查找节点的父节点 ID 和在父节点 children 中的位置
 */
function findParentInfo(
  nodeId: BlockId,
  nodes: Record<BlockId, BlockNode>,
  rootId: BlockId,
): { parentId: BlockId | null; index: number } {
  for (const [id, node] of Object.entries(nodes)) {
    if (node.type === BlockType.Container && node.props.children.includes(nodeId)) {
      const index = node.props.children.indexOf(nodeId);
      return { parentId: id, index };
    }
  }
  return { parentId: null, index: -1 };
}

/**
 * 创建所有内置命令
 * 使用 getStore() 惰性获取 store 引用，避免循环依赖
 */
export function createBuiltinCommands(getStore: () => EditorStore): Command[] {
  return [
    // ---- 1. node.add ----
    {
      name: 'node.add',
      description: '添加节点',
      execute: (params: CommandParams) => {
        const { parentId, node } = params as AddNodeParams;
        const store = getStore();
        store.addNode(parentId, node);
      },
      undo: (params: CommandParams) => {
        const { node } = params as AddNodeParams;
        const store = getStore();
        store.removeNode(node.id);
      },
    },

    // ---- 2. node.remove ----
    {
      name: 'node.remove',
      description: '删除节点',
      execute: (params: CommandParams) => {
        const { nodeId } = params as RemoveNodeParams;
        const store = getStore();
        const doc = store.getDocumentSnapshot();
        if (!doc) return;

        const node = doc.nodes[nodeId];
        if (!node) return;

        // 通过闭包捕获：保存完整节点数据和父节点信息
        const savedNode = JSON.parse(JSON.stringify(node)) as BlockNode;
        const { parentId, index } = findParentInfo(nodeId, doc.nodes, doc.rootId);

        // 将保存的状态附加到 params 上，供 undo 使用
        (params as RemoveNodeParams & {
          __savedNode?: BlockNode;
          __parentId?: BlockId | null;
          __index?: number;
        }).__savedNode = savedNode;
        (params as RemoveNodeParams & {
          __savedNode?: BlockNode;
          __parentId?: BlockId | null;
          __index?: number;
        }).__parentId = parentId;
        (params as RemoveNodeParams & {
          __savedNode?: BlockNode;
          __parentId?: BlockId | null;
          __index?: number;
        }).__index = index;

        store.removeNode(nodeId);
      },
      undo: (params: CommandParams) => {
        const store = getStore();
        const extendedParams = params as RemoveNodeParams & {
          __savedNode?: BlockNode;
          __parentId?: BlockId | null;
          __index?: number;
        };

        if (!extendedParams.__savedNode || !extendedParams.__parentId) return;

        // 先添加节点到 store
        store.addNode(extendedParams.__parentId, extendedParams.__savedNode);

        // 如果原位置不是末尾，需要移动到正确位置
        if (
          extendedParams.__index !== undefined &&
          extendedParams.__index >= 0
        ) {
          const doc = store.getDocumentSnapshot();
          if (doc) {
            const parent = doc.nodes[extendedParams.__parentId];
            if (
              parent &&
              parent.type === BlockType.Container &&
              parent.props.children.length > extendedParams.__index + 1
            ) {
              store.moveNode(
                extendedParams.__savedNode.id,
                extendedParams.__parentId,
                extendedParams.__index,
              );
            }
          }
        }
      },
    },

    // ---- 3. node.update ----
    {
      name: 'node.update',
      description: '更新节点属性',
      execute: (params: CommandParams) => {
        const { nodeId, updates } = params as UpdateNodeParams;
        const store = getStore();
        const oldNode = store.getNode(nodeId);

        // 通过闭包捕获旧节点数据
        (params as UpdateNodeParams & { __oldNode?: BlockNode }).__oldNode = oldNode
          ? (JSON.parse(JSON.stringify(oldNode)) as BlockNode)
          : undefined;

        store.updateNode(nodeId, updates);
      },
      undo: (params: CommandParams) => {
        const { nodeId } = params as UpdateNodeParams;
        const store = getStore();
        const extendedParams = params as UpdateNodeParams & {
          __oldNode?: BlockNode;
        };

        if (!extendedParams.__oldNode) return;

        // 用旧值完整恢复节点
        store.updateNode(nodeId, extendedParams.__oldNode);
      },
    },

    // ---- 4. node.updateStyle ----
    {
      name: 'node.updateStyle',
      description: '更新节点样式',
      execute: (params: CommandParams) => {
        const { nodeId, style } = params as UpdateStyleParams;
        const store = getStore();
        const node = store.getNode(nodeId);

        // 通过闭包捕获旧样式
        (params as UpdateStyleParams & { __oldStyle?: BlockStyle }).__oldStyle = node
          ? { ...node.style }
          : undefined;

        store.updateNodeStyle(nodeId, style);
      },
      undo: (params: CommandParams) => {
        const { nodeId } = params as UpdateStyleParams;
        const store = getStore();
        const extendedParams = params as UpdateStyleParams & {
          __oldStyle?: BlockStyle;
        };

        if (!extendedParams.__oldStyle) return;

        store.updateNodeStyle(nodeId, extendedParams.__oldStyle);
      },
    },

    // ---- 5. node.updateLayout ----
    {
      name: 'node.updateLayout',
      description: '更新节点布局',
      execute: (params: CommandParams) => {
        const { nodeId, layout } = params as UpdateLayoutParams;
        const store = getStore();
        const node = store.getNode(nodeId);

        // 通过闭包捕获旧布局
        (params as UpdateLayoutParams & { __oldLayout?: BlockLayout }).__oldLayout = node
          ? { ...node.layout }
          : undefined;

        store.updateNodeLayout(nodeId, layout);
      },
      undo: (params: CommandParams) => {
        const { nodeId } = params as UpdateLayoutParams;
        const store = getStore();
        const extendedParams = params as UpdateLayoutParams & {
          __oldLayout?: BlockLayout;
        };

        if (!extendedParams.__oldLayout) return;

        store.updateNodeLayout(nodeId, extendedParams.__oldLayout);
      },
    },

    // ---- 6. node.move ----
    {
      name: 'node.move',
      description: '移动节点',
      execute: (params: CommandParams) => {
        const { nodeId, newParentId, index } = params as MoveNodeParams;
        const store = getStore();
        const doc = store.getDocumentSnapshot();
        if (!doc) return;

        // 通过闭包捕获旧父节点和位置
        const { parentId: oldParentId, index: oldIndex } = findParentInfo(
          nodeId,
          doc.nodes,
          doc.rootId,
        );

        (params as MoveNodeParams & {
          __oldParentId?: BlockId | null;
          __oldIndex?: number;
        }).__oldParentId = oldParentId;
        (params as MoveNodeParams & {
          __oldParentId?: BlockId | null;
          __oldIndex?: number;
        }).__oldIndex = oldIndex;

        store.moveNode(nodeId, newParentId, index);
      },
      undo: (params: CommandParams) => {
        const { nodeId } = params as MoveNodeParams;
        const store = getStore();
        const extendedParams = params as MoveNodeParams & {
          __oldParentId?: BlockId | null;
          __oldIndex?: number;
        };

        if (!extendedParams.__oldParentId) return;

        store.moveNode(
          nodeId,
          extendedParams.__oldParentId,
          extendedParams.__oldIndex,
        );
      },
    },
  ];
}
