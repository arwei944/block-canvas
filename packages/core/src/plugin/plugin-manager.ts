import type {
  BlockPlugin,
  BlockComponentDefinition,
  ExporterDefinition,
  CommandDefinition,
  PluginAPI,
} from './types';
import type { EditorStoreHook } from '../store/types';

type EventHandler = (...args: unknown[]) => void;

/**
 * 插件管理器 —— 负责插件的注册、销毁以及各注册表的维护。
 */
export class PluginManager {
  // ---- 内部注册表 ----

  private plugins: Map<string, BlockPlugin> = new Map();
  private componentRegistry: Map<string, BlockComponentDefinition> = new Map();
  private exporterRegistry: Map<string, ExporterDefinition> = new Map();
  private propertyFieldRegistry: Map<string, unknown> = new Map();
  private commandRegistry: Map<string, CommandDefinition> = new Map();
  private eventListeners: Map<string, Set<EventHandler>> = new Map();

  /** 编辑器 store hook，由宿主应用在初始化时注入 */
  private storeHook: EditorStoreHook | null = null;

  // ---- Store 注入 ----

  /** 设置编辑器 store hook，必须在注册插件之前调用 */
  setStore(hook: EditorStoreHook): void {
    this.storeHook = hook;
  }

  // ---- 插件注册 / 注销 ----

  /** 注册并初始化一个插件 */
  registerPlugin(plugin: BlockPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[PluginManager] Plugin "${plugin.name}" is already registered, skipping.`);
      return;
    }

    // 检查依赖
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          console.warn(
            `[PluginManager] Plugin "${plugin.name}" depends on "${dep}" which is not registered.`,
          );
        }
      }
    }

    const api = this.createPluginAPI();
    plugin.init(api);
    this.plugins.set(plugin.name, plugin);
  }

  /** 注销并销毁一个插件 */
  unregisterPlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    if (plugin.destroy) {
      plugin.destroy();
    }

    this.plugins.delete(name);
  }

  /** 获取已注册的插件 */
  getPlugin(name: string): BlockPlugin | undefined {
    return this.plugins.get(name);
  }

  /** 获取所有已注册的插件名称 */
  getPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  // ---- 组件注册 ----

  registerComponent(definition: BlockComponentDefinition): void {
    this.componentRegistry.set(definition.type, definition);
  }

  getComponentDefinition(type: string): BlockComponentDefinition | undefined {
    return this.componentRegistry.get(type);
  }

  getAllComponentDefinitions(): BlockComponentDefinition[] {
    return Array.from(this.componentRegistry.values());
  }

  // ---- 导出器注册 ----

  registerExporter(exporter: ExporterDefinition): void {
    this.exporterRegistry.set(exporter.format, exporter);
  }

  getExporter(format: string): ExporterDefinition | undefined {
    return this.exporterRegistry.get(format);
  }

  getAllExporters(): ExporterDefinition[] {
    return Array.from(this.exporterRegistry.values());
  }

  // ---- 属性字段注册 ----

  registerPropertyField(type: string, component: unknown): void {
    this.propertyFieldRegistry.set(type, component);
  }

  getPropertyField(type: string): unknown {
    return this.propertyFieldRegistry.get(type);
  }

  // ---- 命令注册 ----

  registerCommand(name: string, command: CommandDefinition): void {
    this.commandRegistry.set(name, command);
  }

  getCommand(name: string): CommandDefinition | undefined {
    return this.commandRegistry.get(name);
  }

  // ---- 事件系统 ----

  /** 触发事件 */
  emit(event: string, ...args: unknown[]): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(...args);
        } catch (err) {
          console.error(`[PluginManager] Error in event handler for "${event}":`, err);
        }
      }
    }
  }

  /** 订阅事件，返回取消订阅函数 */
  on(event: string, handler: EventHandler): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);

    return () => {
      this.off(event, handler);
    };
  }

  /** 取消订阅事件 */
  off(event: string, handler: EventHandler): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  // ---- 内部方法 ----

  /** 创建传递给插件的 API 对象 */
  private createPluginAPI(): PluginAPI {
    return {
      registerComponent: (definition) => this.registerComponent(definition),
      registerExporter: (exporter) => this.registerExporter(exporter),
      registerCommand: (name, command) => this.registerCommand(name, command),
      registerPropertyField: (type, component) =>
        this.registerPropertyField(type, component),
      getStore: () => {
        if (!this.storeHook) {
          throw new Error(
            '[PluginManager] Store hook has not been set. Call setStore() before registering plugins.',
          );
        }
        return this.storeHook;
      },
      on: (event, handler) => this.on(event, handler),
    };
  }
}

/** 全局单例 */
export const pluginManager = new PluginManager();
