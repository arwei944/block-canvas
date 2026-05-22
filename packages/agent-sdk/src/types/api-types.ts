/**
 * Agent SDK API 类型定义
 */

import type {
  BlockNode,
  BlockStyle,
  BlockLayout,
  BlockType,
} from '@block-canvas/core';

// ---- SDK 配置 ----

export interface BlockCanvasClientConfig {
  /** 服务端 endpoint 地址 */
  endpoint: string;
  /** 项目 ID（可选） */
  projectId?: string;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 请求超时（毫秒） */
  timeout?: number;
}

// ---- 通用 API 响应 ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---- 节点操作请求类型 ----

export interface AddNodeRequest {
  parentId: string;
  type: BlockType;
  name?: string;
  data?: Record<string, unknown>;
  style?: Partial<BlockStyle>;
  layout?: Partial<BlockLayout>;
  index?: number;
}

export interface UpdateDataRequest {
  data: Record<string, unknown>;
}

export interface UpdateStyleRequest {
  style: Partial<BlockStyle>;
}

export interface UpdateLayoutRequest {
  layout: Partial<BlockLayout>;
}

export interface MoveNodeRequest {
  newParentId: string;
  index?: number;
}

export interface QueryNodesParams {
  /** 按类型过滤 */
  type?: BlockType;
  /** 按名称模糊匹配 */
  name?: string;
  /** 限制返回数量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
}

// ---- 节点 API 响应 ----

export interface NodeApiResponse {
  nodeId: string;
}

export interface NodeGetResponse {
  node: BlockNode;
}

export interface NodeListResponse {
  nodes: BlockNode[];
  total: number;
}

// ---- 快照相关 ----

export interface SnapshotOptions {
  detail?: 'summary' | 'full';
  includeStyles?: boolean;
  includeLayout?: boolean;
}

export interface StructuredSnapshot {
  canvas: {
    width: number;
    height: number;
    nodeCount: number;
  };
  nodes: Array<{
    id: string;
    type: string;
    name: string;
    bounds?: { x: number; y: number; width: number; height: number };
    children: string[];
    style?: Record<string, unknown>;
    textContent?: string;
  }>;
  tree: TreeNode;
}

export interface TreeNode {
  id: string;
  name: string;
  type: string;
  children: TreeNode[];
}

// ---- 视觉反馈 ----

export interface ScreenshotOptions {
  /** 截图格式 */
  format?: 'png' | 'jpeg' | 'webp';
  /** 缩放比例 */
  scale?: number;
  /** 指定节点 ID 截图（可选，默认截整个画布） */
  nodeId?: string;
}

export interface ScreenshotResponse {
  image: string;
  width: number;
  height: number;
}

export interface SnapshotResponse {
  snapshot: StructuredSnapshot;
}

export interface DescriptionResponse {
  description: string;
}

export interface DiagnosticIssue {
  nodeId: string;
  nodeName: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface DiagnosticReport {
  issues: DiagnosticIssue[];
  summary: string;
}

export interface FixResult {
  fixes: Array<{
    nodeId: string;
    action: string;
    description: string;
  }>;
  success: boolean;
}

// ---- 画布自描述 ----

export interface CanvasOverview {
  name: string;
  nodeCount: number;
  rootId: string;
  types: Record<string, number>;
  description: string;
}

export interface ComponentInfo {
  type: string;
  name: string;
  description: string;
  props: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
}

export interface ComponentDefinition {
  type: string;
  name: string;
  description: string;
  defaultProps: Record<string, unknown>;
  exampleStyle: Record<string, unknown>;
  usage: string;
}

export interface NodeRelationships {
  nodeId: string;
  parent: string | null;
  children: string[];
  siblings: string[];
  depth: number;
}

export interface HistoryEntry {
  id: string;
  commandName: string;
  description: string;
  timestamp: number;
  params: Record<string, unknown>;
}

// ---- 事务 ----

export type OperationType =
  | 'add'
  | 'remove'
  | 'updateData'
  | 'updateStyle'
  | 'updateLayout'
  | 'move'
  | 'duplicate';

export interface Operation {
  type: OperationType;
  params: Record<string, unknown>;
  /** 用于事务内引用的 pending ID，如 <pending:0> */
  pendingId?: string;
}

export interface TransactionResult {
  success: boolean;
  /** pending ID 到真实 ID 的映射 */
  idMap: Record<string, string>;
  /** 各操作的执行结果 */
  results: Array<{ operation: OperationType; success: boolean; nodeId?: string }>;
  error?: string;
}

// ---- 错误 ----

export class BlockCanvasError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'BlockCanvasError';
  }
}
