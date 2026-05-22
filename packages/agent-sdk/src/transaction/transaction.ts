/**
 * 批量事务 —— 允许将多个节点操作打包为原子事务
 */

import type { BlockStyle, BlockLayout } from '@block-canvas/core';
import type {
  Operation,
  OperationType,
  TransactionResult,
  AddNodeRequest,
  MoveNodeRequest,
} from '../types';
import type { HttpTransport } from '../client/http-transport';

/**
 * 事务内节点 API —— 与 NodesApi 相同接口，但操作不立即执行
 */
export class TransactionNodesApi {
  private pendingCounter = 0;

  constructor(private readonly collectOperation: (op: Operation) => void) {}

  /**
   * 生成 pending 引用 ID
   */
  private nextPendingId(): string {
    return `<pending:${this.pendingCounter++}>`;
  }

  /**
   * 添加节点（事务内）
   * @returns pending 引用 ID，可用于后续操作引用
   */
  add(params: Omit<AddNodeRequest, 'parentId'> & { parentId: string }): string {
    const pendingId = this.nextPendingId();
    this.collectOperation({
      type: 'add',
      params: { ...params, pendingId },
    });
    return pendingId;
  }

  /**
   * 删除节点（事务内）
   */
  remove(id: string): void {
    this.collectOperation({
      type: 'remove',
      params: { id },
    });
  }

  /**
   * 更新节点数据（事务内）
   */
  updateData(id: string, data: Record<string, unknown>): void {
    this.collectOperation({
      type: 'updateData',
      params: { id, data },
    });
  }

  /**
   * 更新节点样式（事务内）
   */
  updateStyle(id: string, style: Partial<BlockStyle>): void {
    this.collectOperation({
      type: 'updateStyle',
      params: { id, style },
    });
  }

  /**
   * 更新节点布局（事务内）
   */
  updateLayout(id: string, layout: Partial<BlockLayout>): void {
    this.collectOperation({
      type: 'updateLayout',
      params: { id, layout },
    });
  }

  /**
   * 移动节点（事务内）
   */
  move(id: string, params: MoveNodeRequest): void {
    this.collectOperation({
      type: 'move',
      params: { id, ...params },
    });
  }

  /**
   * 复制节点（事务内）
   * @returns pending 引用 ID
   */
  duplicate(id: string): string {
    const pendingId = this.nextPendingId();
    this.collectOperation({
      type: 'duplicate',
      params: { id, pendingId },
    });
    return pendingId;
  }
}

/**
 * 事务 —— 将多个操作打包为原子操作
 */
export class Transaction {
  private operations: Operation[] = [];
  private committed = false;
  private rolledBack = false;

  /** 事务内节点 API */
  readonly nodes: TransactionNodesApi;

  constructor(private readonly transport: HttpTransport) {
    this.nodes = new TransactionNodesApi((op) => {
      this.operations.push(op);
    });
  }

  /**
   * 提交事务 —— 将所有操作一次性发送到服务端
   */
  async commit(): Promise<TransactionResult> {
    if (this.committed) {
      throw new Error('[Transaction] Transaction has already been committed');
    }
    if (this.rolledBack) {
      throw new Error('[Transaction] Transaction has been rolled back');
    }
    this.committed = true;

    return this.transport.post<TransactionResult>('/transactions/commit', {
      operations: this.operations,
    });
  }

  /**
   * 回滚事务 —— 放弃所有操作
   */
  async rollback(): Promise<void> {
    if (this.committed) {
      throw new Error('[Transaction] Transaction has already been committed');
    }
    if (this.rolledBack) {
      throw new Error('[Transaction] Transaction has already been rolled back');
    }
    this.rolledBack = true;
    this.operations = [];
  }

  /**
   * 获取当前已收集的操作数量
   */
  get operationCount(): number {
    return this.operations.length;
  }

  /**
   * 获取当前已收集的操作列表（只读副本）
   */
  getOperations(): readonly Operation[] {
    return [...this.operations];
  }
}

/**
 * 事务工厂
 */
export class TransactionFactory {
  constructor(private readonly transport: HttpTransport) {}

  /**
   * 开始一个新事务
   */
  begin(): Transaction {
    return new Transaction(this.transport);
  }
}
