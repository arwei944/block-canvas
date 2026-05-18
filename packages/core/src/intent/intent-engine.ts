import { BlockType, type BlockId, type BlockNode, type BlockStyle, type BlockLayout, type BlockDocument } from '../types';
import {
  createTextBlock,
  createImageBlock,
  createButtonBlock,
  createContainerBlock,
  generateBlockId,
} from '../node';
import type { EditorStoreHook, EditorStore } from '../store/types';
import type {
  ParsedOperation,
  IntentPreview,
  IntentResult,
  IntentParserHandler,
} from './types';

// ============================================================
// 映射表
// ============================================================

/** 中文组件名 → BlockType */
const COMPONENT_NAME_MAP: Record<string, BlockType> = {
  '文本': BlockType.Text,
  '文字': BlockType.Text,
  '标题': BlockType.Text,
  '段落': BlockType.Text,
  '图片': BlockType.Image,
  '图像': BlockType.Image,
  '照片': BlockType.Image,
  '按钮': BlockType.Button,
  '容器': BlockType.Container,
  '盒子': BlockType.Container,
  '表单': BlockType.Container,
  '导航栏': BlockType.Container,
  '侧边栏': BlockType.Container,
  '页头': BlockType.Container,
  '页脚': BlockType.Container,
  '卡片': BlockType.Container,
  '弹窗': BlockType.Container,
  '模态框': BlockType.Container,
  '列表': BlockType.Container,
  'Logo': BlockType.Image,
  'logo': BlockType.Image,
  '输入框': BlockType.Text,
  '搜索框': BlockType.Text,
};

/** 中文样式属性名 → CSS 属性名 */
const STYLE_PROPERTY_MAP: Record<string, keyof BlockStyle> = {
  '背景色': 'backgroundColor',
  '背景颜色': 'backgroundColor',
  '颜色': 'color',
  '字号': 'fontSize',
  '字体大小': 'fontSize',
  '宽度': 'width',
  '高度': 'height',
  '边距': 'margin',
  '外边距': 'margin',
  '内边距': 'padding',
  '圆角': 'borderRadius',
  '透明度': 'opacity',
  '边框': 'border',
  '阴影': 'boxShadow',
  '字体粗细': 'fontWeight',
  '行高': 'lineHeight',
  '字体': 'fontFamily',
  '对齐': 'textAlign',
  '光标': 'cursor',
};

/** 中文颜色名 → 颜色值 */
const COLOR_MAP: Record<string, string> = {
  '红色': '#ef4444',
  '红': '#ef4444',
  '蓝色': '#3b82f6',
  '蓝': '#3b82f6',
  '绿色': '#22c55e',
  '绿': '#22c55e',
  '黄色': '#eab308',
  '黄': '#eab308',
  '橙色': '#f97316',
  '橙': '#f97316',
  '紫色': '#a855f7',
  '紫': '#a855f7',
  '粉色': '#ec4899',
  '粉': '#ec4899',
  '黑色': '#000000',
  '黑': '#000000',
  '白色': '#ffffff',
  '白': '#ffffff',
  '灰色': '#6b7280',
  '灰': '#6b7280',
  '深灰': '#374151',
  '浅灰': '#d1d5db',
  '天蓝': '#0ea5e9',
  '深蓝': '#1e40af',
  '浅蓝': '#93c5fd',
  '青色': '#06b6d4',
  '棕色': '#92400e',
  '金色': '#d97706',
  '银色': '#9ca3af',
};

/** 中文布局方向 → CSS flexDirection */
const LAYOUT_DIRECTION_MAP: Record<string, BlockLayout['flexDirection']> = {
  '水平': 'row',
  '横向': 'row',
  '垂直': 'column',
  '纵向': 'column',
  '水平反转': 'row-reverse',
  '垂直反转': 'column-reverse',
};

/** 中文布局预设名 */
const LAYOUT_PRESET_MAP: Record<string, Partial<BlockLayout> & Partial<BlockStyle>> = {
  '侧边栏': {
    flexDirection: 'row',
  },
  '导航栏': {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  '页头': {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  '页脚': {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '卡片': {
    flexDirection: 'column',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  },
  '居中': {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '表单': {
    flexDirection: 'column',
    gap: 16,
  },
  '列表': {
    flexDirection: 'column',
    gap: 8,
  },
  '网格': {
    display: 'grid',
  },
};

// ============================================================
// 辅助函数
// ============================================================

/**
 * 解析颜色值：支持中文颜色名、hex、rgb 等
 */
function resolveColor(value: string): string {
  const trimmed = value.trim();
  // 直接是合法 CSS 颜色值
  if (/^#([0-9a-fA-F]{3,8})$/.test(trimmed)) return trimmed;
  if (/^(rgb|rgba|hsl|hsla)\(/.test(trimmed)) return trimmed;
  // 中文颜色名映射
  if (COLOR_MAP[trimmed]) return COLOR_MAP[trimmed];
  // 默认原样返回
  return trimmed;
}

/**
 * 解析组件类型：支持中文组件名和英文类型名
 */
function resolveBlockType(name: string): BlockType | null {
  const trimmed = name.trim();
  // 直接匹配 BlockType 枚举值
  if (Object.values(BlockType).includes(trimmed as BlockType)) {
    return trimmed as BlockType;
  }
  // 中文组件名映射
  if (COMPONENT_NAME_MAP[trimmed]) {
    return COMPONENT_NAME_MAP[trimmed];
  }
  return null;
}

/**
 * 根据组件类型生成默认名称
 */
function getDefaultName(blockType: BlockType): string {
  const nameMap: Record<BlockType, string> = {
    [BlockType.Text]: 'Text Block',
    [BlockType.Image]: 'Image Block',
    [BlockType.Button]: 'Button Block',
    [BlockType.Container]: 'Container Block',
  };
  return nameMap[blockType] ?? 'Block';
}

/**
 * 根据名称在文档中查找节点
 */
function findNodeByName(
  nodes: Record<BlockId, BlockNode>,
  name: string,
): BlockNode | undefined {
  const trimmed = name.trim();
  // 精确匹配
  for (const node of Object.values(nodes)) {
    if (node.name === trimmed) return node;
  }
  // 模糊匹配（包含关系）
  for (const node of Object.values(nodes)) {
    if (node.name.includes(trimmed) || trimmed.includes(node.name)) return node;
  }
  return undefined;
}

/**
 * 根据名称在文档中查找容器节点
 */
function findContainerByName(
  nodes: Record<BlockId, BlockNode>,
  name: string,
): BlockNode | undefined {
  const trimmed = name.trim();
  for (const node of Object.values(nodes)) {
    if (node.type === BlockType.Container && node.name === trimmed) return node;
  }
  for (const node of Object.values(nodes)) {
    if (node.type === BlockType.Container && (node.name.includes(trimmed) || trimmed.includes(node.name))) {
      return node;
    }
  }
  return undefined;
}

// ============================================================
// IntentEngine
// ============================================================

export class IntentEngine {
  private getStore: () => EditorStoreHook;

  /** 内置规则模板 */
  private builtInParsers: Array<{ pattern: RegExp; handler: IntentParserHandler }>;

  /** 用户自定义解析器 */
  private customParsers: Array<{ pattern: RegExp; handler: IntentParserHandler }> = [];

  constructor(getStore: () => EditorStoreHook) {
    this.getStore = getStore;
    this.builtInParsers = this.createBuiltInParsers();
  }

  // ----------------------------------------------------------
  // 公共 API
  // ----------------------------------------------------------

  /**
   * 解析单条自然语言意图，返回操作列表（不执行）
   */
  parse(intent: string): ParsedOperation[] {
    const trimmed = intent.trim();
    if (!trimmed) return [];

    // 先尝试自定义解析器
    for (const { pattern, handler } of this.customParsers) {
      const match = trimmed.match(pattern);
      if (match) {
        return handler(match, trimmed);
      }
    }

    // 再尝试内置解析器
    for (const { pattern, handler } of this.builtInParsers) {
      const match = trimmed.match(pattern);
      if (match) {
        return handler(match, trimmed);
      }
    }

    return [];
  }

  /**
   * 预览意图（不执行），返回预览信息
   */
  preview(intent: string): IntentPreview {
    const operations = this.parse(intent);
    const store = this.getStore()();
    const doc = store.getDocumentSnapshot();

    const affectedNodes: string[] = [];
    for (const op of operations) {
      if (op.params.targetNodeId && typeof op.params.targetNodeId === 'string') {
        affectedNodes.push(op.params.targetNodeId);
      }
      if (op.params.parentId && typeof op.params.parentId === 'string') {
        affectedNodes.push(op.params.parentId);
      }
    }

    const impactDescriptions: string[] = operations.map((op) => op.description);

    return {
      plannedOperations: operations,
      affectedNodes: [...new Set(affectedNodes)],
      estimatedImpact: impactDescriptions.join('；') || '无操作',
    };
  }

  /**
   * 执行单条意图
   */
  execute(intent: string): IntentResult {
    const operations = this.parse(intent);
    if (operations.length === 0) {
      return {
        success: false,
        operations: [],
        error: '无法解析该意图，请检查输入',
      };
    }

    try {
      const createdNodes: Record<string, string> = {};
      const store = this.getStore()();
      const doc = store.getDocumentSnapshot();

      if (!doc) {
        return {
          success: false,
          operations,
          error: '文档未初始化',
        };
      }

      for (const op of operations) {
        this.executeOperation(op, store, doc, createdNodes);
      }

      return {
        success: true,
        operations,
        createdNodes: Object.keys(createdNodes).length > 0 ? createdNodes : undefined,
      };
    } catch (err) {
      return {
        success: false,
        operations,
        error: err instanceof Error ? err.message : '执行过程中发生未知错误',
      };
    }
  }

  /**
   * 批量执行意图
   */
  executeBatch(intents: string[]): IntentResult {
    const allOperations: ParsedOperation[] = [];
    const allCreatedNodes: Record<string, string> = {};

    try {
      const store = this.getStore()();
      const doc = store.getDocumentSnapshot();

      if (!doc) {
        return {
          success: false,
          operations: [],
          error: '文档未初始化',
        };
      }

      for (const intent of intents) {
        const operations = this.parse(intent);
        if (operations.length === 0) {
          return {
            success: false,
            operations: allOperations,
            error: `无法解析意图："${intent}"`,
          };
        }

        allOperations.push(...operations);

        for (const op of operations) {
          this.executeOperation(op, store, doc, allCreatedNodes);
        }
      }

      return {
        success: true,
        operations: allOperations,
        createdNodes: Object.keys(allCreatedNodes).length > 0 ? allCreatedNodes : undefined,
      };
    } catch (err) {
      return {
        success: false,
        operations: allOperations,
        error: err instanceof Error ? err.message : '批量执行过程中发生未知错误',
      };
    }
  }

  /**
   * 注册自定义意图解析器
   */
  registerParser(pattern: RegExp, handler: IntentParserHandler): void {
    this.customParsers.push({ pattern, handler });
  }

  // ----------------------------------------------------------
  // 执行单个操作
  // ----------------------------------------------------------

  private executeOperation(
    op: ParsedOperation,
    store: EditorStore,
    doc: BlockDocument,
    createdNodes: Record<string, string>,
  ): void {
    switch (op.type) {
      case 'node.add': {
        const blockType = op.params.blockType as BlockType;
        const parentId = (op.params.parentId as string) || doc.rootId;
        const pendingId = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        let node: BlockNode;
        switch (blockType) {
          case BlockType.Text:
            node = createTextBlock(op.params.content as string ?? '', {
              id: pendingId,
              name: (op.params.name as string) || getDefaultName(blockType),
            });
            break;
          case BlockType.Image:
            node = createImageBlock(op.params.src as string ?? '', {
              id: pendingId,
              name: (op.params.name as string) || getDefaultName(blockType),
            });
            break;
          case BlockType.Button:
            node = createButtonBlock(op.params.label as string ?? 'Button', {
              id: pendingId,
              name: (op.params.name as string) || getDefaultName(blockType),
            });
            break;
          case BlockType.Container:
            node = createContainerBlock([], {
              id: pendingId,
              name: (op.params.name as string) || getDefaultName(blockType),
            });
            break;
          default:
            throw new Error(`不支持的组件类型: ${blockType}`);
        }

        store.addNode(parentId, node);
        createdNodes[pendingId] = pendingId;
        break;
      }

      case 'node.remove': {
        const nodeId = op.params.targetNodeId as string;
        if (!nodeId) throw new Error('未找到要删除的节点');
        store.removeNode(nodeId);
        break;
      }

      case 'node.update': {
        const nodeId = op.params.targetNodeId as string;
        if (!nodeId) throw new Error('未找到要更新的节点');
        if (op.params.props) {
          store.updateNode(nodeId, { props: op.params.props } as Partial<BlockNode>);
        }
        break;
      }

      case 'node.updateStyle': {
        const nodeId = op.params.targetNodeId as string;
        if (!nodeId) throw new Error('未找到要更新样式的节点');
        const style = op.params.style as Partial<BlockStyle>;
        store.updateNodeStyle(nodeId, style);
        break;
      }

      case 'node.move': {
        const nodeId = op.params.targetNodeId as string;
        const newParentId = op.params.newParentId as string;
        if (!nodeId) throw new Error('未找到要移动的节点');
        if (!newParentId) throw new Error('未找到目标容器');
        store.moveNode(nodeId, newParentId);
        break;
      }

      case 'spatial.setLayout': {
        const nodeId = op.params.targetNodeId as string;
        if (!nodeId) throw new Error('未找到要设置布局的节点');
        const layout = op.params.layout as Partial<BlockLayout>;
        store.updateNodeLayout(nodeId, layout);
        break;
      }

      case 'spatial.center': {
        const nodeId = op.params.targetNodeId as string;
        if (!nodeId) throw new Error('未找到要居中的节点');
        store.updateNodeStyle(nodeId, {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        } as Partial<BlockStyle>);
        store.updateNodeLayout(nodeId, {
          alignItems: 'center',
          justifyContent: 'center',
        });
        break;
      }

      case 'spatial.setGap': {
        const nodeId = op.params.targetNodeId as string;
        if (!nodeId) throw new Error('未找到要设置间距的节点');
        const gap = op.params.gap as number;
        store.updateNodeLayout(nodeId, { gap });
        break;
      }

      case 'spatial.setSize': {
        const nodeId = op.params.targetNodeId as string;
        if (!nodeId) throw new Error('未找到要设置尺寸的节点');
        const size = op.params.size as Partial<BlockStyle>;
        store.updateNodeStyle(nodeId, size);
        break;
      }

      case 'spatial.applyPreset': {
        const nodeId = op.params.targetNodeId as string;
        if (!nodeId) throw new Error('未找到要应用预设的节点');
        const layout = op.params.layout as Partial<BlockLayout>;
        const style = op.params.style as Partial<BlockStyle>;
        if (layout) store.updateNodeLayout(nodeId, layout);
        if (style) store.updateNodeStyle(nodeId, style);
        break;
      }

      default:
        throw new Error(`未知的操作类型: ${(op as ParsedOperation).type}`);
    }
  }

  // ----------------------------------------------------------
  // 内置规则模板
  // ----------------------------------------------------------

  private createBuiltInParsers(): Array<{ pattern: RegExp; handler: IntentParserHandler }> {
    const self = this;

    return [
      // 1. 添加组件: "添加一个按钮" / "在导航栏添加一个Logo"
      {
        pattern: /(?:在|往)?(.+?)(?:中|里面)?添加一个?(.+?)(?:组件|节点|元素)?$/,
        handler(match) {
          const [, locationStr, componentStr] = match;
          const blockType = resolveBlockType(componentStr);
          if (!blockType) return [];

          const store = self.getStore()();
          const doc = store.getDocumentSnapshot();
          if (!doc) return [];

          // 查找目标容器
          let parentId = doc.rootId;
          let name = getDefaultName(blockType);

          if (locationStr && locationStr.trim()) {
            const container = findContainerByName(doc.nodes, locationStr.trim());
            if (container) {
              parentId = container.id;
            }
            name = componentStr.trim();
          }

          // 根据组件类型设置默认内容
          const params: Record<string, unknown> = {
            blockType,
            parentId,
            name,
          };

          switch (blockType) {
            case BlockType.Text:
              params.content = name;
              break;
            case BlockType.Button:
              params.label = name;
              break;
            case BlockType.Image:
              params.src = '';
              break;
            case BlockType.Container:
              break;
          }

          return [{
            type: 'node.add',
            params,
            description: `添加${componentStr}到${parentId === doc.rootId ? '根容器' : locationStr}`,
          }];
        },
      },

      // 1b. 添加组件（简化版）: "添加一个按钮"
      {
        pattern: /添加一个?(.+?)(?:组件|节点|元素)?$/,
        handler(match) {
          const [, componentStr] = match;
          const blockType = resolveBlockType(componentStr);
          if (!blockType) return [];

          const store = self.getStore()();
          const doc = store.getDocumentSnapshot();
          if (!doc) return [];

          const name = componentStr.trim();
          const params: Record<string, unknown> = {
            blockType,
            parentId: doc.rootId,
            name,
          };

          switch (blockType) {
            case BlockType.Text:
              params.content = name;
              break;
            case BlockType.Button:
              params.label = name;
              break;
            case BlockType.Image:
              params.src = '';
              break;
            case BlockType.Container:
              break;
          }

          return [{
            type: 'node.add',
            params,
            description: `添加${componentStr}到根容器`,
          }];
        },
      },

      // 2. 删除组件: "删除按钮" / "删除按钮节点"
      {
        pattern: /删除(.+?)(?:节点|组件|元素)?$/,
        handler(match) {
          const [, targetStr] = match;
          const store = self.getStore()();
          const doc = store.getDocumentSnapshot();
          if (!doc) return [];

          const node = findNodeByName(doc.nodes, targetStr.trim());
          if (!node) return [];

          return [{
            type: 'node.remove',
            params: { targetNodeId: node.id, targetName: targetStr.trim() },
            description: `删除${targetStr}`,
          }];
        },
      },

      // 3. 修改样式: "设置按钮的背景色为蓝色"
      {
        pattern: /设置?(.+?)的?(背景色|背景颜色|颜色|字号|字体大小|宽度|高度|边距|外边距|内边距|圆角|透明度|边框|阴影|字体粗细|行高|字体|字间距|对齐|光标)为(.+)/,
        handler(match) {
          const [, targetStr, propStr, valueStr] = match;
          const store = self.getStore()();
          const doc = store.getDocumentSnapshot();
          if (!doc) return [];

          const node = findNodeByName(doc.nodes, targetStr.trim());
          if (!node) return [];

          const cssProp = STYLE_PROPERTY_MAP[propStr];
          if (!cssProp) return [];

          let value: string | number = valueStr.trim();
          // 颜色属性需要解析中文颜色名
          if (cssProp === 'backgroundColor' || cssProp === 'color') {
            value = resolveColor(valueStr.trim());
          }

          return [{
            type: 'node.updateStyle',
            params: {
              targetNodeId: node.id,
              targetName: targetStr.trim(),
              style: { [cssProp]: value },
            },
            description: `设置${targetStr}的${propStr}为${valueStr}`,
          }];
        },
      },

      // 4. 修改内容: "设置标题的文字为Hello World"
      {
        pattern: /设置?(.+?)的?(文字|文本|内容)为(.+)/,
        handler(match) {
          const [, targetStr, , valueStr] = match;
          const store = self.getStore()();
          const doc = store.getDocumentSnapshot();
          if (!doc) return [];

          const node = findNodeByName(doc.nodes, targetStr.trim());
          if (!node) return [];

          const content = valueStr.trim();

          // 根据节点类型设置不同的 props
          let props: Record<string, unknown>;
          switch (node.type) {
            case BlockType.Text:
              props = { content };
              break;
            case BlockType.Button:
              props = { label: content };
              break;
            case BlockType.Image:
              props = { src: content };
              break;
            default:
              props = { content };
              break;
          }

          return [{
            type: 'node.update',
            params: {
              targetNodeId: node.id,
              targetName: targetStr.trim(),
              props,
            },
            description: `设置${targetStr}的内容为${content}`,
          }];
        },
      },

      // 5. 居中: "让登录表单居中"
      {
        pattern: /让?(.+?)居中/,
        handler(match) {
          const [, targetStr] = match;
          const store = self.getStore()();
          const doc = store.getDocumentSnapshot();
          if (!doc) return [];

          const node = findNodeByName(doc.nodes, targetStr.trim());
          if (!node) return [];

          return [{
            type: 'spatial.center',
            params: {
              targetNodeId: node.id,
              targetName: targetStr.trim(),
            },
            description: `让${targetStr}居中`,
          }];
        },
      },

      // 6. 设置布局: "设置导航栏为水平布局"
      {
        pattern: /设置?(.+?)为?(水平|垂直|横向|纵向|水平反转|垂直反转|网格)布局/,
        handler(match) {
          const [, targetStr, directionStr] = match;
          const store = self.getStore()();
          const doc = store.getDocumentSnapshot();
          if (!doc) return [];

          const node = findNodeByName(doc.nodes, targetStr.trim());
          if (!node) return [];

          const flexDirection = LAYOUT_DIRECTION_MAP[directionStr];
          if (!flexDirection) return [];

          const layout: Partial<BlockLayout> = { flexDirection };

          return [{
            type: 'spatial.setLayout',
            params: {
              targetNodeId: node.id,
              targetName: targetStr.trim(),
              layout,
            },
            description: `设置${targetStr}为${directionStr}布局`,
          }];
        },
      },

      // 7. 移动节点: "把按钮移到表单容器"
      {
        pattern: /把?(.+?)移(?:动)?到?(.+)/,
        handler(match) {
          const [, sourceStr, destStr] = match;
          const store = self.getStore()();
          const doc = store.getDocumentSnapshot();
          if (!doc) return [];

          const sourceNode = findNodeByName(doc.nodes, sourceStr.trim());
          if (!sourceNode) return [];

          const destNode = findContainerByName(doc.nodes, destStr.trim());
          if (!destNode) return [];

          return [{
            type: 'node.move',
            params: {
              targetNodeId: sourceNode.id,
              targetName: sourceStr.trim(),
              newParentId: destNode.id,
              newParentName: destStr.trim(),
            },
            description: `把${sourceStr}移到${destStr}`,
          }];
        },
      },

      // 8. 设置间距: "设置表单的间距为16px"
      {
        pattern: /设置?(.+?)的间距为(\d+)px/,
        handler(match) {
          const [, targetStr, gapStr] = match;
          const store = self.getStore()();
          const doc = store.getDocumentSnapshot();
          if (!doc) return [];

          const node = findNodeByName(doc.nodes, targetStr.trim());
          if (!node) return [];

          const gap = parseInt(gapStr, 10);

          return [{
            type: 'spatial.setGap',
            params: {
              targetNodeId: node.id,
              targetName: targetStr.trim(),
              gap,
            },
            description: `设置${targetStr}的间距为${gap}px`,
          }];
        },
      },

      // 9. 设置尺寸: "设置图片的宽度为100%"
      {
        pattern: /设置?(.+?)的?(宽度|高度)为(.+)/,
        handler(match) {
          const [, targetStr, dimensionStr, valueStr] = match;
          const store = self.getStore()();
          const doc = store.getDocumentSnapshot();
          if (!doc) return [];

          const node = findNodeByName(doc.nodes, targetStr.trim());
          if (!node) return [];

          const sizeKey = dimensionStr === '宽度' ? 'width' : 'height';
          const value = valueStr.trim();

          return [{
            type: 'spatial.setSize',
            params: {
              targetNodeId: node.id,
              targetName: targetStr.trim(),
              size: { [sizeKey]: value },
            },
            description: `设置${targetStr}的${dimensionStr}为${value}`,
          }];
        },
      },

      // 10. 应用预设: "应用侧边栏布局"
      {
        pattern: /应用?(.+?)布局/,
        handler(match) {
          const [, presetStr] = match;
          const store = self.getStore()();
          const doc = store.getDocumentSnapshot();
          if (!doc) return [];

          const presetName = presetStr.trim();
          const preset = LAYOUT_PRESET_MAP[presetName];
          if (!preset) return [];

          // 找到当前选中的节点，或使用根节点
          const selection = store.selection;
          let targetNodeId = doc.rootId;
          let targetName = '根容器';

          if (selection.selectedIds.length > 0) {
            const selectedNode = doc.nodes[selection.selectedIds[0]];
            if (selectedNode) {
              targetNodeId = selectedNode.id;
              targetName = selectedNode.name;
            }
          }

          // 分离 layout 和 style 属性
          const layoutKeys = new Set<keyof BlockLayout>([
            'position', 'top', 'left', 'flexDirection', 'alignItems',
            'justifyContent', 'flexGrow', 'flexShrink', 'flexBasis', 'gap',
          ]);

          const layout: Partial<BlockLayout> = {};
          const style: Partial<BlockStyle> = {};

          for (const [key, val] of Object.entries(preset)) {
            if (layoutKeys.has(key as keyof BlockLayout)) {
              (layout as Record<string, unknown>)[key] = val;
            } else {
              (style as Record<string, unknown>)[key] = val;
            }
          }

          return [{
            type: 'spatial.applyPreset',
            params: {
              targetNodeId,
              targetName,
              presetName,
              layout: Object.keys(layout).length > 0 ? layout : undefined,
              style: Object.keys(style).length > 0 ? style : undefined,
            },
            description: `应用${presetName}布局到${targetName}`,
          }];
        },
      },
    ];
  }
}
