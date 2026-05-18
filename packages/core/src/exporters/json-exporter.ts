import type { BlockDocument } from '../types/node';
import type { ExporterDefinition } from '../plugin/types';

/**
 * JSON 导出器 —— 将 BlockDocument 序列化为格式化 JSON，支持反序列化。
 */
export const jsonExporter: ExporterDefinition = {
  format: 'json',
  name: 'JSON',

  async export(document: BlockDocument): Promise<string> {
    return JSON.stringify(document, null, 2);
  },

  async import(content: string): Promise<BlockDocument> {
    const parsed = JSON.parse(content) as BlockDocument;

    // 基础校验
    if (!parsed.id || typeof parsed.id !== 'string') {
      throw new Error('Invalid document: missing or invalid "id" field.');
    }
    if (!parsed.name || typeof parsed.name !== 'string') {
      throw new Error('Invalid document: missing or invalid "name" field.');
    }
    if (!parsed.rootId || typeof parsed.rootId !== 'string') {
      throw new Error('Invalid document: missing or invalid "rootId" field.');
    }
    if (!parsed.nodes || typeof parsed.nodes !== 'object') {
      throw new Error('Invalid document: missing or invalid "nodes" field.');
    }
    if (!(parsed.rootId in parsed.nodes)) {
      throw new Error('Invalid document: root node not found in "nodes".');
    }

    return parsed;
  },
};
