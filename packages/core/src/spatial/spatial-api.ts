import type { EditorStoreHook } from '../store';
import type { BlockId, BlockStyle, BlockLayout, BlockNode } from '../types';
import { BlockType } from '../types';

// ---- 类型定义 ----

export interface LayoutConfig {
  mode: 'flex' | 'grid' | 'free';
  direction?: 'row' | 'column';
  gap?: number;
  padding?: number | string;
  alignItems?: string;
  justifyContent?: string;
}

export interface AlignConfig {
  axis: 'horizontal' | 'vertical';
  align: 'start' | 'center' | 'end' | 'stretch';
  relativeTo?: 'container' | 'first' | 'last';
}

export interface DistributeConfig {
  axis: 'horizontal' | 'vertical';
  equalSpacing?: boolean;
}

export interface CenterConfig {
  in: string; // container nodeId
  axis: 'horizontal' | 'vertical' | 'both';
}

export interface SizeConfig {
  width?: string | number;
  height?: string | number;
  minHeight?: number;
  maxHeight?: number;
  minWidth?: number;
  maxWidth?: number;
}

export interface ResponsiveConfig {
  desktop?: Partial<LayoutConfig>;
  tablet?: Partial<LayoutConfig>;
  mobile?: Partial<LayoutConfig>;
}

/**
 * 空间语义 API —— 提供布局、对齐、分布、居中、尺寸、响应式等操作
 */
export class SpatialAPI {
  constructor(private getStore: () => EditorStoreHook) {}

  /**
   * 获取 store 实例
   */
  private getStoreInstance() {
    return this.getStore()();
  }

  // ---- 布局设置 ----

  /**
   * 设置节点的布局模式
   */
  setLayout(nodeId: BlockId, config: LayoutConfig): void {
    const store = this.getStoreInstance();
    const node = store.getNode(nodeId);
    if (!node) return;

    const style: Partial<BlockStyle> = {};
    const layout: Partial<BlockLayout> = {};

    if (config.mode === 'flex') {
      style.display = 'flex';
      if (config.direction) {
        style.flexDirection = config.direction;
        layout.flexDirection = config.direction;
      }
      if (config.alignItems !== undefined) {
        style.alignItems = config.alignItems;
        layout.alignItems = config.alignItems;
      }
      if (config.justifyContent !== undefined) {
        style.justifyContent = config.justifyContent;
      }
    } else if (config.mode === 'grid') {
      style.display = 'grid';
    } else {
      // free 模式 - 子元素使用绝对定位
      style.display = 'flex';
      style.position = 'relative';
    }

    if (config.gap !== undefined) {
      style.gap = config.gap;
      layout.gap = config.gap;
    }

    if (config.padding !== undefined) {
      style.padding = typeof config.padding === 'number' ? `${config.padding}px` : config.padding;
    }

    store.updateNodeStyle(nodeId, style);
    store.updateNodeLayout(nodeId, layout);
  }

  // ---- 布局预设 ----

  /**
   * 应用布局预设
   */
  applyPreset(nodeId: BlockId, preset: string): void {
    const handler = this.presets[preset];
    if (handler) {
      handler.call(this, nodeId);
    } else {
      throw new Error(`未知的布局预设: "${preset}"。可用预设: ${Object.keys(this.presets).join(', ')}`);
    }
  }

  // ---- 对齐 ----

  /**
   * 对齐多个节点
   */
  align(nodeIds: BlockId[], config: AlignConfig): void {
    if (nodeIds.length < 2) return;

    const store = this.getStoreInstance();
    const nodes = nodeIds
      .map((id) => store.getNode(id))
      .filter(Boolean);

    if (nodes.length < 2) return;

    const relativeTo = config.relativeTo ?? 'container';

    if (relativeTo === 'container') {
      // 相对于容器对齐 - 找到共同的父容器
      // 这里简化处理：使用第一个节点的父容器作为参考
      // 实际应用中可能需要更复杂的逻辑来找到共同父容器
      this.alignRelativeToContainer(nodeIds, config);
    } else if (relativeTo === 'first') {
      this.alignRelativeToNode(nodeIds, config, nodeIds[0]);
    } else if (relativeTo === 'last') {
      this.alignRelativeToNode(nodeIds, config, nodeIds[nodeIds.length - 1]);
    }
  }

  // ---- 等间距分布 ----

  /**
   * 等间距分布多个节点
   */
  distribute(nodeIds: BlockId[], config: DistributeConfig): void {
    if (nodeIds.length < 3) return;

    const store = this.getStoreInstance();

    // 收集所有节点的位置和尺寸信息
    const nodeInfos = nodeIds
      .map((id) => {
        const node = store.getNode(id);
        if (!node) return null;
        return {
          id,
          left: node.style.left ?? node.layout.left ?? 0,
          top: node.style.top ?? node.layout.top ?? 0,
          width: this.parsePixelValue(node.style.width) ?? 100,
          height: this.parsePixelValue(node.style.height) ?? 100,
        };
      })
      .filter((info): info is NonNullable<typeof info> => info !== null);

    if (nodeInfos.length < 3) return;

    if (config.axis === 'horizontal') {
      // 水平分布：基于 left 值
      const minLeft = Math.min(...nodeInfos.map((n) => n.left));
      const maxRight = Math.max(...nodeInfos.map((n) => n.left + n.width));
      const totalSpace = maxRight - minLeft;
      const totalWidth = nodeInfos.reduce((sum, n) => sum + n.width, 0);
      const spacing = (totalSpace - totalWidth) / (nodeInfos.length - 1);

      let currentLeft = minLeft;
      for (const info of nodeInfos) {
        store.updateNodeStyle(info.id, { left: currentLeft });
        currentLeft += info.width + spacing;
      }
    } else {
      // 垂直分布：基于 top 值
      const minTop = Math.min(...nodeInfos.map((n) => n.top));
      const maxBottom = Math.max(...nodeInfos.map((n) => n.top + n.height));
      const totalSpace = maxBottom - minTop;
      const totalHeight = nodeInfos.reduce((sum, n) => sum + n.height, 0);
      const spacing = (totalSpace - totalHeight) / (nodeInfos.length - 1);

      let currentTop = minTop;
      for (const info of nodeInfos) {
        store.updateNodeStyle(info.id, { top: currentTop });
        currentTop += info.height + spacing;
      }
    }
  }

  // ---- 居中 ----

  /**
   * 将节点在指定容器中居中
   */
  center(nodeId: BlockId, config: CenterConfig): void {
    const store = this.getStoreInstance();
    const containerNode = store.getNode(config.in);
    const targetNode = store.getNode(nodeId);
    if (!containerNode || !targetNode) return;

    const containerWidth = this.parsePixelValue(containerNode.style.width) ?? 800;
    const containerHeight = this.parsePixelValue(containerNode.style.height) ?? 600;
    const targetWidth = this.parsePixelValue(targetNode.style.width) ?? 100;
    const targetHeight = this.parsePixelValue(targetNode.style.height) ?? 100;

    const style: Partial<BlockStyle> = {};

    if (config.axis === 'horizontal' || config.axis === 'both') {
      const left = (containerWidth - targetWidth) / 2;
      style.left = Math.round(left);
    }

    if (config.axis === 'vertical' || config.axis === 'both') {
      const top = (containerHeight - targetHeight) / 2;
      style.top = Math.round(top);
    }

    store.updateNodeStyle(nodeId, style);
  }

  // ---- 间距 ----

  /**
   * 设置节点的间距
   */
  setGap(nodeId: BlockId, value: number, _unit: string = 'px'): void {
    const store = this.getStoreInstance();
    store.updateNodeStyle(nodeId, { gap: value });
    store.updateNodeLayout(nodeId, { gap: value });
  }

  // ---- 尺寸 ----

  /**
   * 设置节点的尺寸
   *
   * 注意：minHeight/maxHeight/minWidth/maxWidth 存储在节点的 data 字段中，
   * 因为 BlockStyle 接口不包含这些属性。
   */
  setSize(nodeId: BlockId, config: SizeConfig): void {
    const store = this.getStoreInstance();
    const style: Partial<BlockStyle> = {};
    const extraData: Record<string, unknown> = {};

    if (config.width !== undefined) {
      style.width = typeof config.width === 'number' ? `${config.width}px` : config.width;
    }
    if (config.height !== undefined) {
      style.height = typeof config.height === 'number' ? `${config.height}px` : config.height;
    }
    if (config.minHeight !== undefined) {
      extraData.minHeight = `${config.minHeight}px`;
    }
    if (config.maxHeight !== undefined) {
      extraData.maxHeight = `${config.maxHeight}px`;
    }
    if (config.minWidth !== undefined) {
      extraData.minWidth = `${config.minWidth}px`;
    }
    if (config.maxWidth !== undefined) {
      extraData.maxWidth = `${config.maxWidth}px`;
    }

    store.updateNodeStyle(nodeId, style);

    // 将 BlockStyle 不支持的约束属性存入 data
    if (Object.keys(extraData).length > 0) {
      const node = store.getNode(nodeId);
      if (node) {
        const existingData = node.data ?? {};
        store.updateNode(nodeId, {
          data: { ...existingData, sizeConstraints: extraData },
        } as Partial<BlockNode>);
      }
    }
  }

  // ---- 响应式 ----

  /**
   * 设置响应式布局配置
   *
   * 将不同断点的配置存储在节点的 data 字段中，
   * 实际的响应式切换由渲染层根据当前视口宽度来应用。
   */
  setResponsive(nodeId: BlockId, config: ResponsiveConfig): void {
    const store = this.getStoreInstance();
    const node = store.getNode(nodeId);
    if (!node) return;

    const existingData = node.data ?? {};
    store.updateNode(nodeId, {
      data: {
        ...existingData,
        responsive: config,
      },
    } as Partial<BlockNode>);
  }

  // ---- 私有方法 ----

  /**
   * 布局预设定义
   */
  private presets: Record<string, (nodeId: BlockId) => void> = {
    'sidebar-content': (nodeId: BlockId) => {
      this.setLayout(nodeId, { mode: 'grid' });
      const store = this.getStoreInstance();
      store.updateNodeStyle(nodeId, {
        gridTemplateColumns: '240px 1fr',
      } as Partial<BlockStyle>);
    },

    'center-stack': (nodeId: BlockId) => {
      this.setLayout(nodeId, {
        mode: 'flex',
        direction: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      });
    },

    'holy-grail': (nodeId: BlockId) => {
      this.setLayout(nodeId, { mode: 'grid' });
      const store = this.getStoreInstance();
      store.updateNodeStyle(nodeId, {
        gridTemplate: 'auto 1fr auto / 200px 1fr 200px',
      } as Partial<BlockStyle>);
    },

    'dashboard-grid': (nodeId: BlockId) => {
      this.setLayout(nodeId, { mode: 'grid' });
      const store = this.getStoreInstance();
      store.updateNodeStyle(nodeId, {
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      } as Partial<BlockStyle>);
    },

    'header-content-footer': (nodeId: BlockId) => {
      this.setLayout(nodeId, { mode: 'grid' });
      const store = this.getStoreInstance();
      store.updateNodeStyle(nodeId, {
        gridTemplateRows: 'auto 1fr auto',
      } as Partial<BlockStyle>);
    },

    'two-columns': (nodeId: BlockId) => {
      this.setLayout(nodeId, { mode: 'grid' });
      const store = this.getStoreInstance();
      store.updateNodeStyle(nodeId, {
        gridTemplateColumns: '1fr 1fr',
      } as Partial<BlockStyle>);
    },

    'three-columns': (nodeId: BlockId) => {
      this.setLayout(nodeId, { mode: 'grid' });
      const store = this.getStoreInstance();
      store.updateNodeStyle(nodeId, {
        gridTemplateColumns: '1fr 1fr 1fr',
      } as Partial<BlockStyle>);
    },
  };

  /**
   * 相对于容器对齐节点
   */
  private alignRelativeToContainer(nodeIds: BlockId[], config: AlignConfig): void {
    const store = this.getStoreInstance();
    const doc = store.getDocumentSnapshot();
    if (!doc) return;

    // 找到第一个节点的父容器
    const firstNode = store.getNode(nodeIds[0]);
    if (!firstNode) return;

    const parentId = this.findParentId(nodeIds[0], doc.nodes, doc.rootId);
    if (!parentId) return;

    const parentNode = store.getNode(parentId);
    if (!parentNode) return;

    const containerWidth = this.parsePixelValue(parentNode.style.width) ?? 800;
    const containerHeight = this.parsePixelValue(parentNode.style.height) ?? 600;

    for (const id of nodeIds) {
      const node = store.getNode(id);
      if (!node) continue;

      const nodeWidth = this.parsePixelValue(node.style.width) ?? 100;
      const nodeHeight = this.parsePixelValue(node.style.height) ?? 100;
      const style: Partial<BlockStyle> = {};

      if (config.axis === 'horizontal') {
        switch (config.align) {
          case 'start':
            style.left = 0;
            break;
          case 'center':
            style.left = Math.round((containerWidth - nodeWidth) / 2);
            break;
          case 'end':
            style.left = Math.round(containerWidth - nodeWidth);
            break;
          case 'stretch':
            style.width = `${containerWidth}px`;
            style.left = 0;
            break;
        }
      } else {
        // vertical
        switch (config.align) {
          case 'start':
            style.top = 0;
            break;
          case 'center':
            style.top = Math.round((containerHeight - nodeHeight) / 2);
            break;
          case 'end':
            style.top = Math.round(containerHeight - nodeHeight);
            break;
          case 'stretch':
            style.height = `${containerHeight}px`;
            style.top = 0;
            break;
        }
      }

      store.updateNodeStyle(id, style);
    }
  }

  /**
   * 相对于参考节点对齐
   */
  private alignRelativeToNode(nodeIds: BlockId[], config: AlignConfig, referenceId: BlockId): void {
    const store = this.getStoreInstance();
    const refNode = store.getNode(referenceId);
    if (!refNode) return;

    const refLeft = refNode.style.left ?? refNode.layout.left ?? 0;
    const refTop = refNode.style.top ?? refNode.layout.top ?? 0;
    const refWidth = this.parsePixelValue(refNode.style.width) ?? 100;
    const refHeight = this.parsePixelValue(refNode.style.height) ?? 100;

    for (const id of nodeIds) {
      if (id === referenceId) continue;

      const node = store.getNode(id);
      if (!node) continue;

      const nodeWidth = this.parsePixelValue(node.style.width) ?? 100;
      const nodeHeight = this.parsePixelValue(node.style.height) ?? 100;
      const style: Partial<BlockStyle> = {};

      if (config.axis === 'horizontal') {
        switch (config.align) {
          case 'start':
            style.left = refLeft;
            break;
          case 'center':
            style.left = Math.round(refLeft + (refWidth - nodeWidth) / 2);
            break;
          case 'end':
            style.left = Math.round(refLeft + refWidth - nodeWidth);
            break;
          case 'stretch':
            style.width = `${refWidth}px`;
            style.left = refLeft;
            break;
        }
      } else {
        // vertical
        switch (config.align) {
          case 'start':
            style.top = refTop;
            break;
          case 'center':
            style.top = Math.round(refTop + (refHeight - nodeHeight) / 2);
            break;
          case 'end':
            style.top = Math.round(refTop + refHeight - nodeHeight);
            break;
          case 'stretch':
            style.height = `${refHeight}px`;
            style.top = refTop;
            break;
        }
      }

      store.updateNodeStyle(id, style);
    }
  }

  /**
   * 查找节点的父节点 ID
   */
  private findParentId(
    nodeId: BlockId,
    nodes: Record<BlockId, BlockNode>,
    rootId: BlockId,
  ): BlockId | null {
    if (nodeId === rootId) return null;
    for (const [, node] of Object.entries(nodes)) {
      if (node.type === BlockType.Container && node.props.children.includes(nodeId)) {
        return node.id;
      }
    }
    return null;
  }

  /**
   * 解析 CSS 尺寸值为像素数字
   */
  private parsePixelValue(value: string | number | undefined): number | null {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number') return value;
    const str = value.trim();
    if (str === '' || str === 'auto' || str === '100%' || str === 'fit-content') return null;
    const match = str.match(/^(\d+(?:\.\d+)?)px$/);
    if (match) return parseFloat(match[1]);
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }
}
