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
  readonly nodes: NodesApi;
  readonly feedback: FeedbackApi;
  readonly describe: DescribeApi;
  readonly transaction: TransactionFactory;
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