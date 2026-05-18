import type { BlockStyle, BlockLayout, BlockId, BlockDocument } from '../types/node';
import type { EditorStoreHook } from '../store/types';

// ---- 组件属性配置 ----

export interface PropertyFieldConfig {
  key: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'color'
    | 'select'
    | 'toggle'
    | 'code'
    | 'json'
    | 'image-ref';
  options?: Array<{ label: string; value: string }>;
  defaultValue?: unknown;
  required?: boolean;
  description?: string;
}

// ---- 组件类型定义（供插件注册） ----

export interface BlockComponentDefinition {
  type: string;
  name: string;
  category: 'basic' | 'layout' | 'form' | 'data' | 'custom';
  icon?: string;
  defaultData: Record<string, unknown>;
  defaultStyle: Partial<BlockStyle>;
  defaultLayout?: Partial<BlockLayout>;
  isContainer: boolean;
  childRules?: {
    allowedTypes?: string[];
    maxChildren?: number;
  };
  propertyConfig: PropertyFieldConfig[];
}

// ---- 导出器定义 ----

export interface ExporterDefinition {
  format: string;
  name: string;
  export: (document: BlockDocument) => Promise<string>;
  import?: (content: string) => Promise<BlockDocument>;
}

// ---- 命令定义 ----

export interface CommandDefinition {
  execute: (params: unknown) => void;
  undo?: (params: unknown) => void;
}

// ---- 插件接口 ----

export interface BlockPlugin {
  name: string;
  version?: string;
  dependencies?: string[];
  init: (api: PluginAPI) => void;
  destroy?: () => void;
}

// ---- 插件 API ----

export interface PluginAPI {
  registerComponent: (definition: BlockComponentDefinition) => void;
  registerExporter: (exporter: ExporterDefinition) => void;
  registerCommand: (
    name: string,
    command: CommandDefinition,
  ) => void;
  registerPropertyField: (type: string, component: unknown) => void;
  getStore: () => EditorStoreHook;
  on: (event: string, handler: (...args: unknown[]) => void) => () => void;
}
