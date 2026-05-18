/**
 * 视觉反馈 API —— 截图、快照、描述、诊断、自动修复
 */

import type {
  ScreenshotOptions,
  ScreenshotResponse,
  SnapshotOptions,
  StructuredSnapshot,
  SnapshotResponse,
  DescriptionResponse,
  DiagnosticReport,
  FixResult,
} from '../types';
import type { HttpTransport } from '../client/http-transport';

export class FeedbackApi {
  constructor(private readonly transport: HttpTransport) {}

  /**
   * 获取画布截图
   */
  async screenshot(options?: ScreenshotOptions): Promise<ScreenshotResponse> {
    return this.transport.post<ScreenshotResponse>('/feedback/screenshot', options);
  }

  /**
   * 获取结构化快照
   */
  async snapshot(options?: SnapshotOptions): Promise<StructuredSnapshot> {
    const response = await this.transport.post<SnapshotResponse>(
      '/feedback/snapshot',
      options,
    );
    return response.snapshot;
  }

  /**
   * 获取画布自然语言描述
   */
  async describe(options?: { style?: 'concise' | 'detailed' }): Promise<string> {
    const response = await this.transport.post<DescriptionResponse>(
      '/feedback/describe',
      options,
    );
    return response.description;
  }

  /**
   * 诊断画布问题
   */
  async diagnose(): Promise<DiagnosticReport> {
    return this.transport.post<DiagnosticReport>('/feedback/diagnose');
  }

  /**
   * 自动修复检测到的问题
   */
  async autoFix(): Promise<FixResult> {
    return this.transport.post<FixResult>('/feedback/auto-fix');
  }
}
