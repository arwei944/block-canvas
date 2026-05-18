import type { BlockId, BlockNode, BlockStyle, BlockLayout } from '../types';

// ---- Command Params ----

export interface AddNodeParams {
  parentId: BlockId;
  node: BlockNode;
}

export interface RemoveNodeParams {
  nodeId: BlockId;
}

export interface UpdateNodeParams {
  nodeId: BlockId;
  updates: Partial<BlockNode>;
}

export interface UpdateStyleParams {
  nodeId: BlockId;
  style: Partial<BlockStyle>;
}

export interface UpdateLayoutParams {
  nodeId: BlockId;
  layout: Partial<BlockLayout>;
}

export interface MoveNodeParams {
  nodeId: BlockId;
  newParentId: BlockId;
  index?: number;
}

export type CommandParams =
  | AddNodeParams
  | RemoveNodeParams
  | UpdateNodeParams
  | UpdateStyleParams
  | UpdateLayoutParams
  | MoveNodeParams;

// ---- Command ----

export interface Command {
  /** 命令名称，如 'node.add' */
  name: string;
  /** 命令描述 */
  description: string;
  /** 执行命令 */
  execute: (params: CommandParams) => void;
  /** 撤销命令（可选） */
  undo?: (params: CommandParams) => void;
}

// ---- History ----

export interface HistoryEntry {
  commandName: string;
  description: string;
  params: CommandParams;
  timestamp: number;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

// ---- Registry ----

export type CommandRegistry = Map<string, Command>;
