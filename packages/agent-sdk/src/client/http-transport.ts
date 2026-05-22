/**
 * HTTP 传输层 —— 负责与 BlockCanvas 服务端通信
 */

import type { ApiResponse } from '../types';
import { BlockCanvasError } from '../types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface HttpTransportConfig {
  /** 服务端 endpoint 地址 */
  endpoint: string;
  /** 项目 ID（可选，会附加到请求路径） */
  projectId?: string;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 请求超时（毫秒），默认 30000 */
  timeout?: number;
}

export class HttpTransport {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeout: number;

  constructor(config: HttpTransportConfig) {
    // 去除末尾斜杠
    let base = config.endpoint.replace(/\/+$/, '');
    if (config.projectId) {
      base += `/api/projects/${encodeURIComponent(config.projectId)}`;
    } else {
      base += '/api';
    }
    this.baseUrl = base;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.timeout = config.timeout ?? 30000;
  }

  /**
   * 发送 HTTP 请求
   */
  async request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.defaultHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new BlockCanvasError(
          data.error ?? `HTTP ${response.status}: ${response.statusText}`,
          'HTTP_ERROR',
          response.status,
        );
      }

      if (!data.success) {
        throw new BlockCanvasError(
          data.error ?? 'Request failed',
          'API_ERROR',
          response.status,
        );
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof BlockCanvasError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new BlockCanvasError(
          `Request timeout after ${this.timeout}ms`,
          'TIMEOUT_ERROR',
        );
      }
      throw new BlockCanvasError(
        error instanceof Error ? error.message : 'Unknown error',
        'NETWORK_ERROR',
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET 请求
   */
  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  /**
   * POST 请求
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  /**
   * PUT 请求
   */
  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * DELETE 请求
   */
  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}
