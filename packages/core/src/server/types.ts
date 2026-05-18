// ---- API 通用响应 ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---- 请求体类型 ----

export interface AddNodeRequest {
  parentId: string;
  type: string; // 'text' | 'image' | 'button' | 'container'
  data?: Record<string, unknown>;
  style?: Record<string, unknown>;
  index?: number;
}

export interface UpdateStyleRequest {
  style: Record<string, unknown>;
}

export interface UpdateLayoutRequest {
  layout: Record<string, unknown>;
}

export interface MoveNodeRequest {
  newParentId: string;
  index?: number;
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
