import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginManager } from '../plugin/plugin-manager';
import type { BlockPlugin, BlockComponentDefinition } from '../plugin/types';

describe('PluginManager', () => {
  let pm: PluginManager;

  beforeEach(() => {
    pm = new PluginManager();
  });

  // ---- 注册与初始化 ----

  describe('registerPlugin', () => {
    it('should register and initialize a plugin', () => {
      const initFn = vi.fn();
      const plugin: BlockPlugin = {
        name: 'test-plugin',
        init: initFn,
      };

      pm.registerPlugin(plugin);

      expect(initFn).toHaveBeenCalledTimes(1);
      expect(pm.getPlugin('test-plugin')).toBe(plugin);
      expect(pm.getPluginNames()).toContain('test-plugin');
    });

    it('should pass a valid PluginAPI to plugin.init', () => {
      let receivedApi: any = null;
      const plugin: BlockPlugin = {
        name: 'api-test',
        init: (api) => {
          receivedApi = api;
        },
      };

      pm.registerPlugin(plugin);

      expect(receivedApi).not.toBeNull();
      expect(typeof receivedApi.registerComponent).toBe('function');
      expect(typeof receivedApi.registerExporter).toBe('function');
      expect(typeof receivedApi.registerCommand).toBe('function');
      expect(typeof receivedApi.registerPropertyField).toBe('function');
      expect(typeof receivedApi.on).toBe('function');
    });

    it('should skip duplicate plugin registration', () => {
      const initFn = vi.fn();
      const plugin: BlockPlugin = {
        name: 'dup-plugin',
        init: initFn,
      };

      pm.registerPlugin(plugin);
      pm.registerPlugin(plugin);

      expect(initFn).toHaveBeenCalledTimes(1);
    });

    it('should warn but still register when dependency is not met', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const initFn = vi.fn();
      const plugin: BlockPlugin = {
        name: 'child-plugin',
        dependencies: ['missing-parent'],
        init: initFn,
      };

      pm.registerPlugin(plugin);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('depends on "missing-parent"'),
      );
      // Plugin is still registered and initialized
      expect(initFn).toHaveBeenCalledTimes(1);
      expect(pm.getPlugin('child-plugin')).toBeDefined();

      warnSpy.mockRestore();
    });

    it('should not warn when dependency is met', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const parentPlugin: BlockPlugin = {
        name: 'parent-plugin',
        init: vi.fn(),
      };
      const childPlugin: BlockPlugin = {
        name: 'child-plugin',
        dependencies: ['parent-plugin'],
        init: vi.fn(),
      };

      pm.registerPlugin(parentPlugin);
      pm.registerPlugin(childPlugin);

      // Should only warn about duplicate if any, not about missing dependency
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('depends on'),
      );

      warnSpy.mockRestore();
    });
  });

  // ---- 注销与销毁 ----

  describe('unregisterPlugin', () => {
    it('should unregister and destroy a plugin', () => {
      const destroyFn = vi.fn();
      const plugin: BlockPlugin = {
        name: 'destroy-test',
        init: vi.fn(),
        destroy: destroyFn,
      };

      pm.registerPlugin(plugin);
      pm.unregisterPlugin('destroy-test');

      expect(destroyFn).toHaveBeenCalledTimes(1);
      expect(pm.getPlugin('destroy-test')).toBeUndefined();
      expect(pm.getPluginNames()).not.toContain('destroy-test');
    });

    it('should handle unregistering nonexistent plugin gracefully', () => {
      expect(() => pm.unregisterPlugin('nonexistent')).not.toThrow();
    });

    it('should handle plugin without destroy method', () => {
      const plugin: BlockPlugin = {
        name: 'no-destroy',
        init: vi.fn(),
      };

      pm.registerPlugin(plugin);
      expect(() => pm.unregisterPlugin('no-destroy')).not.toThrow();
      expect(pm.getPlugin('no-destroy')).toBeUndefined();
    });
  });

  // ---- 组件注册 ----

  describe('registerComponent', () => {
    it('should register a component via plugin API', () => {
      const definition: BlockComponentDefinition = {
        type: 'custom-card',
        name: 'Custom Card',
        category: 'custom',
        defaultData: {},
        defaultStyle: { padding: '16px' },
        isContainer: true,
        propertyConfig: [],
      };

      let registeredDef: BlockComponentDefinition | null = null;
      const plugin: BlockPlugin = {
        name: 'component-plugin',
        init: (api) => {
          api.registerComponent(definition);
          registeredDef = pm.getComponentDefinition('custom-card')!;
        },
      };

      pm.registerPlugin(plugin);

      expect(pm.getComponentDefinition('custom-card')).toBeDefined();
      expect(pm.getComponentDefinition('custom-card')!.name).toBe('Custom Card');
    });

    it('should return all registered components', () => {
      const plugin: BlockPlugin = {
        name: 'multi-component',
        init: (api) => {
          api.registerComponent({
            type: 'comp-a',
            name: 'A',
            category: 'basic',
            defaultData: {},
            defaultStyle: {},
            isContainer: false,
            propertyConfig: [],
          });
          api.registerComponent({
            type: 'comp-b',
            name: 'B',
            category: 'basic',
            defaultData: {},
            defaultStyle: {},
            isContainer: false,
            propertyConfig: [],
          });
        },
      };

      pm.registerPlugin(plugin);

      const all = pm.getAllComponentDefinitions();
      expect(all).toHaveLength(2);
    });
  });

  // ---- 事件系统 ----

  describe('events', () => {
    it('should emit events to listeners', () => {
      const handler = vi.fn();
      pm.on('test-event', handler);

      pm.emit('test-event', 'arg1', 'arg2');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should support multiple listeners for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      pm.on('multi-event', handler1);
      pm.on('multi-event', handler2);

      pm.emit('multi-event');

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsub = pm.on('unsub-event', handler);

      pm.emit('unsub-event');
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();

      pm.emit('unsub-event');
      expect(handler).toHaveBeenCalledTimes(1); // should not increase
    });

    it('should handle errors in event handlers gracefully', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const badHandler = vi.fn(() => {
        throw new Error('handler error');
      });
      const goodHandler = vi.fn();

      pm.on('error-event', badHandler);
      pm.on('error-event', goodHandler);

      pm.emit('error-event');

      expect(badHandler).toThrow();
      expect(goodHandler).toHaveBeenCalledTimes(1); // good handler still called
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });

    it('should emit events via plugin API', () => {
      const handler = vi.fn();
      const plugin: BlockPlugin = {
        name: 'event-plugin',
        init: (api) => {
          api.on('plugin-event', handler);
        },
      };

      pm.registerPlugin(plugin);
      pm.emit('plugin-event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  // ---- Store 注入 ----

  describe('setStore', () => {
    it('should allow getStore to work after setStore is called', () => {
      const mockStore = { getState: () => ({}) } as any;
      pm.setStore(mockStore as any);

      let storeHook: any = null;
      const plugin: BlockPlugin = {
        name: 'store-plugin',
        init: (api) => {
          storeHook = api.getStore();
        },
      };

      pm.registerPlugin(plugin);
      expect(storeHook).toBe(mockStore);
    });

    it('should throw when getStore is called without setStore', () => {
      const plugin: BlockPlugin = {
        name: 'no-store-plugin',
        init: (api) => {
          expect(() => api.getStore()).toThrow(
            '[PluginManager] Store hook has not been set',
          );
        },
      };

      pm.registerPlugin(plugin);
    });
  });
});
