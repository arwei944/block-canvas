/**
 * 节点 API —— 提供结构化的节点操作接口
 */

import type { BlockNode, BlockStyle, BlockLayout } from '@block-canvas/core';
import type {
  AddNodeRequest,
  UpdateDataRequest,
  UpdateStyleRequest,
  UpdateLayoutRequest,
  MoveNodeRequest,
  QueryNodesParams,
  NodeApiResponse,
  NodeGetResponse,
  NodeListResponse,
} from '../types';
import type { HttpTransport } from '../client/http-transport';

export class NodesApi {
  constructor(private readonly transport: HttpTransport) {}

  /**
   * 添加节点
   */
  async add(params: AddNodeRequest): Promise<NodeApiResponse> {
    return this.transport.post<NodeApiResponse>('/nodes', params);
  }

  /**
   * 获取单个节点
   */
  async get(id: string): Promise<BlockNode> {
    const response = await this.transport.get<NodeGetResponse>(`/nodes/${encodeURIComponent(id)}`);
    return response.node;
  }

  /**
   * 更新节点数据
   */
  async updateData(id: string, data: Record<string, unknown>): Promise<void> {
    const body: UpdateDataRequest = { data };
    await this.transport.put(`/nodes/${encodeURIComponent(id)}/data`, body);
  }

  /**
   * 更新节点样式
   */
  async updateStyle(id: string, style: Partial<BlockStyle>): Promise<void> {
    const body: UpdateStyleRequest = { style };
    await this.transport.put(`/nodes/${encodeURIComponent(id)}/style`, body);
  }

  /**
   * 更新节点布局
   */
  async updateLayout(id: string, layout: Partial<BlockLayout>): Promise<void> {
    const body: UpdateLayoutRequest = { layout };
    await this.transport.put(`/nodes/${encodeURIComponent(id)}/layout`, body);
  }

  /**
   * 删除节点
   */
  async remove(id: string): Promise<void> {
    await this.transport.delete(`/nodes/${encodeURIComponent(id)}`);
  }

  /**
   * 移动节点
   */
  async move(id: string, params: MoveNodeRequest): Promise<void> {
    await this.transport.post(`/nodes/${encodeURIComponent(id)}/move`, params);
  }

  /**
   * 复制节点
   */
  async duplicate(id: string): Promise<NodeApiResponse> {
    return this.transport.post<NodeApiResponse>(`/nodes/${encodeURIComponent(id)}/duplicate`);
  }

  /**
   * 查询节点列表
   */
  async query(params?: QueryNodesParams): Promise<BlockNode[]> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.name) searchParams.set('name', params.name);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    const path = `/nodes${query ? `?${query}` : ''}`;
    const response = await this.transport.get<NodeListResponse>(path);
    return response.nodes;
  }
}
