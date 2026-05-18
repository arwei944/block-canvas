import type { EditorStoreHook } from '../store';
import type { BlockNode, BlockId } from '../types';
import { BlockType } from '../types';

// ---- 类型定义 ----

export interface DiagnosticIssue {
  severity: 'error' | 'warning' | 'info';
  type: 'overlap' | 'overflow' | 'misalignment' | 'inconsistency' | 'empty-container' | 'deep-nesting' | 'tiny-element';
  nodeIds: string[];
  message: string;
  suggestion: string;
  autoFix?: {
    type: string;
    params: Record<string, unknown>;
  };
}

export interface DiagnosticReport {
  issues: DiagnosticIssue[];
  summary: string;
}

/**
 * 诊断引擎 —— 检测 7 类布局问题
 *
 * 纯逻辑层，不访问真实 DOM，基于节点的 style 和 layout 数据进行推断。
 */
export class DiagnoseEngine {
  constructor(private getStore: () => EditorStoreHook) {}

  /**
   * 执行全量诊断，返回诊断报告
   */
  diagnose(): DiagnosticReport {
    const issues: DiagnosticIssue[] = [];

    issues.push(...this.detectOverlaps());
    issues.push(...this.detectOverflows());
    issues.push(...this.detectMisalignments());
    issues.push(...this.detectInconsistencies());
    issues.push(...this.detectEmptyContainers());
    issues.push(...this.detectDeepNesting());
    issues.push(...this.detectTinyElements());

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const infoCount = issues.filter((i) => i.severity === 'info').length;

    const parts: string[] = [];
    if (errorCount > 0) parts.push(`${errorCount} 个错误`);
    if (warningCount > 0) parts.push(`${warningCount} 个警告`);
    if (infoCount > 0) parts.push(`${infoCount} 个提示`);

    const summary = issues.length === 0
      ? '未检测到布局问题。'
      : `共检测到 ${issues.length} 个问题：${parts.join('、')}。`;

    return { issues, summary };
  }

  // ---- 辅助方法 ----

  /**
   * 获取 store 实例
   */
  private getStoreInstance() {
    return this.getStore()();
  }

  /**
   * 获取当前文档的所有节点
   */
  private getNodes(): Record<BlockId, BlockNode> | null {
    const doc = this.getStoreInstance().getDocumentSnapshot();
    return doc?.nodes ?? null;
  }

  /**
   * 获取根节点 ID
   */
  private getRootId(): BlockId | null {
    const doc = this.getStoreInstance().getDocumentSnapshot();
    return doc?.rootId ?? null;
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
   * 获取同一父容器下的所有兄弟节点
   */
  private getSiblings(
    nodeId: BlockId,
    nodes: Record<BlockId, BlockNode>,
    rootId: BlockId,
  ): BlockNode[] {
    const parentId = this.findParentId(nodeId, nodes, rootId);
    if (!parentId) {
      // 根节点没有兄弟
      return [nodes[rootId]].filter(Boolean);
    }
    const parent = nodes[parentId];
    if (!parent || parent.type !== BlockType.Container) return [];
    return parent.props.children.map((id) => nodes[id]).filter(Boolean);
  }

  /**
   * 解析 CSS 尺寸值为像素数字（简单解析，仅处理 px 和纯数字）
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

  /**
   * 计算节点的嵌套深度
   */
  private getNestingDepth(
    nodeId: BlockId,
    nodes: Record<BlockId, BlockNode>,
    rootId: BlockId,
  ): number {
    let depth = 0;
    let current: BlockId | null = nodeId;
    while (current && current !== rootId) {
      depth++;
      current = this.findParentId(current, nodes, rootId);
    }
    return depth;
  }

  // ---- 7 类检测方法 ----

  /**
   * 检测同一父容器下绝对定位的子节点是否有位置重叠
   */
  private detectOverlaps(): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const nodes = this.getNodes();
    const rootId = this.getRootId();
    if (!nodes || !rootId) return issues;

    // 遍历所有容器节点，检查其绝对定位的子节点
    for (const [, node] of Object.entries(nodes)) {
      if (node.type !== BlockType.Container) continue;
      if (node.props.children.length < 2) continue;

      // 收集绝对定位的子节点及其边界
      const absoluteChildren: Array<{
        id: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }> = [];

      for (const childId of node.props.children) {
        const child = nodes[childId];
        if (!child) continue;

        const position = child.style.position ?? child.layout.position;
        if (position !== 'absolute') continue;

        const x = child.style.left ?? child.layout.left ?? 0;
        const y = child.style.top ?? child.layout.top ?? 0;
        const w = this.parsePixelValue(child.style.width) ?? 0;
        const h = this.parsePixelValue(child.style.height) ?? 0;

        // 跳过没有尺寸信息的节点
        if (w === 0 && h === 0) continue;

        absoluteChildren.push({ id: childId, x, y, w, h });
      }

      // 两两检查重叠
      for (let i = 0; i < absoluteChildren.length; i++) {
        for (let j = i + 1; j < absoluteChildren.length; j++) {
          const a = absoluteChildren[i];
          const b = absoluteChildren[j];

          // AABB 重叠检测
          const overlapX = a.x < b.x + b.w && a.x + a.w > b.x;
          const overlapY = a.y < b.y + b.h && a.y + a.h > b.y;

          if (overlapX && overlapY) {
            issues.push({
              severity: 'warning',
              type: 'overlap',
              nodeIds: [a.id, b.id],
              message: `节点 "${a.id}" 和 "${b.id}" 在容器 "${node.id}" 中存在位置重叠。`,
              suggestion: '调整节点的位置或尺寸以避免重叠。',
              autoFix: {
                type: 'resolve-overlap',
                params: { nodeIds: [a.id, b.id], containerId: node.id },
              },
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * 检测是否有固定高度的容器且子元素可能溢出
   */
  private detectOverflows(): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const nodes = this.getNodes();
    const rootId = this.getRootId();
    if (!nodes || !rootId) return issues;

    for (const [id, node] of Object.entries(nodes)) {
      if (node.type !== BlockType.Container) continue;
      if (node.props.children.length === 0) continue;

      const height = this.parsePixelValue(node.style.height);
      if (height === null) continue; // 没有固定高度，不会溢出

      // 检查 overflow 是否为 hidden/scroll/auto（已处理溢出）
      if (
        node.style.overflow === 'hidden' ||
        node.style.overflow === 'scroll' ||
        node.style.overflow === 'auto'
      ) {
        continue;
      }

      // 估算子元素总高度
      const padding = this.parsePixelValue(node.style.padding) ?? 0;
      const gap = node.style.gap ?? node.layout.gap ?? 0;
      const direction = node.style.flexDirection ?? node.layout.flexDirection ?? 'column';

      let childrenTotalSize = 0;
      let hasSizedChildren = false;

      for (const childId of node.props.children) {
        const child = nodes[childId];
        if (!child) continue;

        const size = direction === 'column'
          ? this.parsePixelValue(child.style.height)
          : this.parsePixelValue(child.style.width);

        if (size !== null) {
          childrenTotalSize += size;
          hasSizedChildren = true;
        }
      }

      // 加上间距
      if (node.props.children.length > 1 && hasSizedChildren) {
        childrenTotalSize += gap * (node.props.children.length - 1);
      }

      // 加上内边距
      childrenTotalSize += padding * 2;

      if (hasSizedChildren && childrenTotalSize > height) {
        issues.push({
          severity: 'warning',
          type: 'overflow',
          nodeIds: [id],
          message: `容器 "${id}" 的固定高度 (${height}px) 可能不足以容纳子元素（估算需要 ${childrenTotalSize}px）。`,
          suggestion: '增加容器高度、减小子元素尺寸，或设置 overflow: hidden/auto。',
          autoFix: {
            type: 'fix-overflow',
            params: { nodeId: id, overflow: 'auto' },
          },
        });
      }
    }

    return issues;
  }

  /**
   * 检查同一层级的元素对齐方式是否一致
   */
  private detectMisalignments(): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const nodes = this.getNodes();
    const rootId = this.getRootId();
    if (!nodes || !rootId) return issues;

    // 遍历所有容器，检查子节点的对齐方式
    for (const [, node] of Object.entries(nodes)) {
      if (node.type !== BlockType.Container) continue;
      if (node.props.children.length < 3) continue; // 少于 3 个子节点不检测

      // 收集子节点的对齐相关属性
      const childAlignments: Array<{
        id: string;
        textAlign: string | undefined;
        alignItems: string | undefined;
      }> = [];

      for (const childId of node.props.children) {
        const child = nodes[childId];
        if (!child) continue;

        childAlignments.push({
          id: childId,
          textAlign: child.style.textAlign,
          alignItems: child.style.alignItems,
        });
      }

      // 检查 textAlign 一致性（仅对有 textAlign 的节点）
      const textAligned = childAlignments.filter((c) => c.textAlign !== undefined);
      if (textAligned.length >= 3) {
        const alignValues = new Set(textAligned.map((c) => c.textAlign));
        if (alignValues.size > 1) {
          issues.push({
            severity: 'info',
            type: 'misalignment',
            nodeIds: textAligned.map((c) => c.id),
            message: `容器 "${node.id}" 下的子节点文本对齐方式不一致：${[...alignValues].join(', ')}。`,
            suggestion: '统一子节点的文本对齐方式以保持视觉一致性。',
          });
        }
      }
    }

    return issues;
  }

  /**
   * 检查同类型组件的样式是否一致
   */
  private detectInconsistencies(): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const nodes = this.getNodes();
    if (!nodes) return issues;

    // 按类型分组
    const groups: Record<string, BlockNode[]> = {};
    for (const [, node] of Object.entries(nodes)) {
      if (!groups[node.type]) groups[node.type] = [];
      groups[node.type].push(node);
    }

    // 对每种类型检查样式一致性
    for (const [type, group] of Object.entries(groups)) {
      if (group.length < 3) continue; // 少于 3 个不检测

      // 检查高度一致性
      const heights = group
        .map((n) => this.parsePixelValue(n.style.height))
        .filter((h): h is number => h !== null);

      if (heights.length >= 3) {
        const uniqueHeights = new Set(heights);
        if (uniqueHeights.size > 1) {
          // 找出不一致的节点
          const heightCounts = new Map<number, number>();
          for (const h of heights) {
            heightCounts.set(h, (heightCounts.get(h) ?? 0) + 1);
          }
          const mostCommonHeight = [...heightCounts.entries()].sort(
            (a, b) => b[1] - a[1],
          )[0][0];

          const inconsistentIds = group
            .filter((n) => {
              const h = this.parsePixelValue(n.style.height);
              return h !== null && h !== mostCommonHeight;
            })
            .map((n) => n.id);

          if (inconsistentIds.length > 0) {
            issues.push({
              severity: 'info',
              type: 'inconsistency',
              nodeIds: inconsistentIds,
              message: `${type} 类型组件的高度不一致，大部分为 ${mostCommonHeight}px，但 ${inconsistentIds.length} 个节点使用了不同的高度。`,
              suggestion: `将所有 ${type} 组件的高度统一为 ${mostCommonHeight}px。`,
              autoFix: {
                type: 'fix-inconsistency',
                params: {
                  nodeIds: inconsistentIds,
                  property: 'height',
                  value: `${mostCommonHeight}px`,
                },
              },
            });
          }
        }
      }

      // 检查 borderRadius 一致性
      const radii = group
        .map((n) => n.style.borderRadius)
        .filter((r): r is string => r !== undefined && r !== '');

      if (radii.length >= 3) {
        const uniqueRadii = new Set(radii);
        if (uniqueRadii.size > 1) {
          const radiusCounts = new Map<string, number>();
          for (const r of radii) {
            radiusCounts.set(r, (radiusCounts.get(r) ?? 0) + 1);
          }
          const mostCommonRadius = [...radiusCounts.entries()].sort(
            (a, b) => b[1] - a[1],
          )[0][0];

          const inconsistentIds = group
            .filter((n) => n.style.borderRadius !== undefined && n.style.borderRadius !== mostCommonRadius)
            .map((n) => n.id);

          if (inconsistentIds.length > 0) {
            issues.push({
              severity: 'info',
              type: 'inconsistency',
              nodeIds: inconsistentIds,
              message: `${type} 类型组件的圆角不一致，大部分为 "${mostCommonRadius}"，但 ${inconsistentIds.length} 个节点使用了不同的圆角。`,
              suggestion: `将所有 ${type} 组件的圆角统一为 "${mostCommonRadius}"。`,
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * 检查容器是否没有子节点
   */
  private detectEmptyContainers(): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const nodes = this.getNodes();
    const rootId = this.getRootId();
    if (!nodes || !rootId) return issues;

    for (const [id, node] of Object.entries(nodes)) {
      if (node.type !== BlockType.Container) continue;
      // 跳过根节点
      if (id === rootId) continue;
      if (node.props.children.length === 0) {
        issues.push({
          severity: 'warning',
          type: 'empty-container',
          nodeIds: [id],
          message: `容器 "${id}" (${node.name}) 没有子节点。`,
          suggestion: '向容器中添加子节点，或删除空容器。',
        });
      }
    }

    return issues;
  }

  /**
   * 检查嵌套深度是否超过 5 层
   */
  private detectDeepNesting(): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const nodes = this.getNodes();
    const rootId = this.getRootId();
    if (!nodes || !rootId) return issues;

    const MAX_DEPTH = 5;

    for (const [id, node] of Object.entries(nodes)) {
      const depth = this.getNestingDepth(id, nodes, rootId);
      if (depth > MAX_DEPTH) {
        issues.push({
          severity: 'warning',
          type: 'deep-nesting',
          nodeIds: [id],
          message: `节点 "${id}" (${node.name}) 的嵌套深度为 ${depth} 层，超过了建议的最大深度 ${MAX_DEPTH} 层。`,
          suggestion: '考虑简化组件层级结构，减少不必要的嵌套容器。',
        });
      }
    }

    return issues;
  }

  /**
   * 检查是否有宽高小于 20px 的元素
   */
  private detectTinyElements(): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const nodes = this.getNodes();
    if (!nodes) return issues;

    const MIN_SIZE = 20;

    for (const [id, node] of Object.entries(nodes)) {
      const width = this.parsePixelValue(node.style.width);
      const height = this.parsePixelValue(node.style.height);

      if (width !== null && width > 0 && width < MIN_SIZE) {
        issues.push({
          severity: 'info',
          type: 'tiny-element',
          nodeIds: [id],
          message: `节点 "${id}" (${node.name}) 的宽度仅为 ${width}px，可能过小而难以交互。`,
          suggestion: `将宽度增加到至少 ${MIN_SIZE}px。`,
        });
      }

      if (height !== null && height > 0 && height < MIN_SIZE) {
        issues.push({
          severity: 'info',
          type: 'tiny-element',
          nodeIds: [id],
          message: `节点 "${id}" (${node.name}) 的高度仅为 ${height}px，可能过小而难以交互。`,
          suggestion: `将高度增加到至少 ${MIN_SIZE}px。`,
        });
      }
    }

    return issues;
  }
}
