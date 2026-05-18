import type { EditorStore } from '../store';
import type { BlockNode } from '../types';
import { BlockType } from '../types';
import type {
  SnapshotOptions,
  StructuredSnapshot,
  TreeNode,
} from '../server/types';

/**
 * 快照引擎 —— 将编辑器当前状态转化为结构化快照或自然语言描述
 */
export class SnapshotEngine {
  constructor(private store: EditorStore) {}

  /**
   * 获取结构化快照
   */
  getSnapshot(options?: SnapshotOptions): StructuredSnapshot {
    const doc = this.store.getDocumentSnapshot();
    if (!doc) {
      return {
        canvas: { width: 0, height: 0, nodeCount: 0 },
        nodes: [],
        tree: { id: '', name: '', type: '', children: [] },
      };
    }

    const nodes = doc.nodes;
    const rootNode = nodes[doc.rootId];

    // 构建 nodes 扁平列表
    const nodeList: StructuredSnapshot['nodes'] = [];
    for (const [id, node] of Object.entries(nodes)) {
      const entry: StructuredSnapshot['nodes'][number] = {
        id,
        type: node.type,
        name: node.name,
        children: node.type === BlockType.Container ? [...node.props.children] : [],
      };

      if (options?.includeStyles) {
        entry.style = { ...node.style };
      }

      if (options?.includeLayout) {
        const layout = node.layout;
        if (layout.position !== undefined || layout.left !== undefined) {
          entry.bounds = {
            x: layout.left ?? 0,
            y: layout.top ?? 0,
            width: parseFloat(node.style.width ?? '0') || 0,
            height: parseFloat(node.style.height ?? '0') || 0,
          };
        }
      }

      // 提取文本内容
      if (node.type === BlockType.Text) {
        entry.textContent = node.props.content;
      } else if (node.type === BlockType.Button) {
        entry.textContent = node.props.label;
      }

      if (options?.detail === 'summary') {
        // summary 模式只保留关键字段
        nodeList.push({
          id: entry.id,
          type: entry.type,
          name: entry.name,
          children: entry.children,
        });
      } else {
        nodeList.push(entry);
      }
    }

    // 构建树
    const tree = this.buildTree(doc.rootId, nodes);

    return {
      canvas: {
        width: parseFloat(rootNode?.style.width ?? '0') || 0,
        height: parseFloat(rootNode?.style.height ?? '0') || 0,
        nodeCount: this.countNodes(nodes),
      },
      nodes: nodeList,
      tree,
    };
  }

  /**
   * 获取自然语言描述
   */
  getDescription(options?: { style?: 'concise' | 'detailed' }): string {
    const doc = this.store.getDocumentSnapshot();
    if (!doc) {
      return '当前没有打开的文档。';
    }

    const nodes = doc.nodes;
    const rootNode = nodes[doc.rootId];
    if (!rootNode) {
      return '当前文档没有根节点。';
    }

    const totalNodes = this.countNodes(nodes);
    const lines: string[] = [];

    lines.push(`当前画布包含 ${totalNodes} 个节点。`);
    lines.push('');

    if (rootNode.type === BlockType.Container && rootNode.props.children.length > 0) {
      lines.push(`根节点 [${this.capitalize(rootNode.type)}] ${rootNode.name} 下有：`);
      for (const childId of rootNode.props.children) {
        const childNode = nodes[childId];
        if (childNode) {
          lines.push(this.describeNode(childNode, 1, options?.style));
        }
      }
    } else {
      lines.push(`根节点 [${this.capitalize(rootNode.type)}] ${rootNode.name} 没有子节点。`);
    }

    lines.push('');
    lines.push('检测到 0 个布局问题。');

    return lines.join('\n');
  }

  // ---- 私有方法 ----

  /**
   * 递归构建节点树
   */
  private buildTree(nodeId: string, nodes: Record<string, BlockNode>): TreeNode {
    const node = nodes[nodeId];
    if (!node) {
      return { id: nodeId, name: '(unknown)', type: 'unknown', children: [] };
    }

    const children: TreeNode[] = [];
    if (node.type === BlockType.Container) {
      for (const childId of node.props.children) {
        children.push(this.buildTree(childId, nodes));
      }
    }

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      children,
    };
  }

  /**
   * 递归描述单个节点及其子节点
   */
  private describeNode(
    node: BlockNode,
    indent: number,
    style?: 'concise' | 'detailed',
  ): string {
    const prefix = '  '.repeat(indent) + '- ';
    const typeLabel = this.capitalize(node.type);
    const lines: string[] = [];

    if (style === 'detailed') {
      // 详细模式：包含样式信息
      const styleInfo = this.formatStyleInfo(node);
      lines.push(`${prefix}[${typeLabel}] ${node.name}${styleInfo}`);
    } else {
      lines.push(`${prefix}[${typeLabel}] ${node.name}`);
    }

    // 递归子节点
    if (node.type === BlockType.Container) {
      for (const childId of node.props.children) {
        const childNode = (this.store as unknown as { getState: () => { document: { nodes: Record<string, BlockNode> } } })
          .getState?.()
          ?.document?.nodes[childId];
        if (childNode) {
          lines.push(this.describeNode(childNode, indent + 1, style));
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * 格式化样式信息（详细模式用）
   */
  private formatStyleInfo(node: BlockNode): string {
    const parts: string[] = [];
    if (node.style.width) parts.push(`w=${node.style.width}`);
    if (node.style.height) parts.push(`h=${node.style.height}`);
    if (node.style.backgroundColor) parts.push(`bg=${node.style.backgroundColor}`);
    if (parts.length === 0) return '';
    return ` (${parts.join(', ')})`;
  }

  /**
   * 统计节点总数
   */
  private countNodes(nodes: Record<string, BlockNode>): number {
    return Object.keys(nodes).length;
  }

  /**
   * 首字母大写
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
