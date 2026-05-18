/**
 * 画布自描述 API —— 提供画布元信息、组件定义、关系查询等
 */

import type {
  CanvasOverview,
  ComponentInfo,
  ComponentDefinition,
  NodeRelationships,
  HistoryEntry,
} from '../types';
import type { HttpTransport } from '../client/http-transport';

export class DescribeApi {
  constructor(private readonly transport: HttpTransport) {}

  /**
   * 获取画布概览
   */
  async overview(): Promise<CanvasOverview> {
    return this.transport.get<CanvasOverview>('/describe/overview');
  }

  /**
   * 获取可用组件列表
   */
  async availableComponents(): Promise<ComponentInfo[]> {
    return this.transport.get<ComponentInfo[]>('/describe/components');
  }

  /**
   * 获取组件定义
   */
  async componentDef(type: string): Promise<ComponentDefinition> {
    return this.transport.get<ComponentDefinition>(
      `/describe/components/${encodeURIComponent(type)}`,
    );
  }

  /**
   * 获取节点关系
   */
  async relationships(id: string): Promise<NodeRelationships> {
    return this.transport.get<NodeRelationships>(
      `/describe/nodes/${encodeURIComponent(id)}/relationships`,
    );
  }

  /**
   * 获取操作历史
   */
  async history(limit?: number): Promise<HistoryEntry[]> {
    const query = limit !== undefined ? `?limit=${limit}` : '';
    return this.transport.get<HistoryEntry[]>(`/describe/history${query}`);
  }
}
