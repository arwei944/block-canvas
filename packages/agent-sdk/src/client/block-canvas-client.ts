/**
 * BlockCanvas SDK 客户端主类
 */

import type { BlockCanvasClientConfig } from '../types';
import { HttpTransport } from './http-transport';
import { NodesApi } from '../api/nodes-api';
import { FeedbackApi } from '../feedback/feedback-api';
import { DescribeApi } from '../describe/describe-api';
import { TransactionFactory } from '../transaction/transaction';

export class BlockCanvasClient {
  /** 节点操作 API */
  readonly nodes: NodesApi;

  /** 视觉反馈 API */
  readonly feedback: FeedbackApi;

  /** 画布自描述 API */
  readonly describe: DescribeApi;

  /** 事务工厂 */
  readonly transaction: TransactionFactory;

  /** HTTP 传输层（可访问底层传输） */
  readonly transport: HttpTransport;

  constructor(config: BlockCanvasClientConfig) {
    this.transport = new HttpTransport({
      endpoint: config.endpoint,
      projectId: config.projectId,
      headers: config.headers,
      timeout: config.timeout,
    });

    this.nodes = new NodesApi(this.transport);
    this.feedback = new FeedbackApi(this.transport);
    this.describe = new DescribeApi(this.transport);
    this.transaction = new TransactionFactory(this.transport);
  }
}
