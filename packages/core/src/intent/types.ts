/**
 * 解析后的操作
 */
export interface ParsedOperation {
  /** 操作类型 */
  type:
    | 'node.add'
    | 'node.update'
    | 'node.updateStyle'
    | 'node.remove'
    | 'node.move'
    | 'spatial.setLayout'
    | 'spatial.center'
    | 'spatial.setGap'
    | 'spatial.setSize'
    | 'spatial.applyPreset';
  /** 操作参数 */
  params: Record<string, unknown>;
  /** 操作描述（人类可读） */
  description: string;
}

/**
 * 意图预览信息
 */
export interface IntentPreview {
  /** 计划执行的操作列表 */
  plannedOperations: ParsedOperation[];
  /** 受影响的节点 ID 列表 */
  affectedNodes: string[];
  /** 预估影响描述 */
  estimatedImpact: string;
}

/**
 * 意图执行结果
 */
export interface IntentResult {
  /** 是否成功 */
  success: boolean;
  /** 执行的操作列表 */
  operations: ParsedOperation[];
  /** 创建的节点映射：pending id -> real id */
  createdNodes?: Record<string, string>;
  /** 错误信息 */
  error?: string;
}

/**
 * 意图解析器处理函数
 */
export type IntentParserHandler = (
  match: RegExpMatchArray,
  intent: string,
) => ParsedOperation[];
