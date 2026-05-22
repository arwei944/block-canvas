import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { IntentEngine } from '../intent/intent-engine';
import {
  createDocument,
  createTextBlock,
  createButtonBlock,
  createContainerBlock,
  createImageBlock,
} from '../node';
import { BlockType } from '../types';
import type { EditorStoreHook } from '../store/types';

/**
 * In Node.js test environment, zustand hooks cannot be called directly
 * because they require React context. We create a fake hook that returns
 * the store state via getState() instead.
 */
function createFakeHook(): EditorStoreHook {
  const fake = (() => useEditorStore.getState()) as unknown as EditorStoreHook;
  return fake;
}

describe('IntentEngine', () => {
  let engine: IntentEngine;
  let doc: ReturnType<typeof createDocument>;

  beforeEach(() => {
    useEditorStore.setState({
      document: null,
      selection: { selectedIds: [], hoveredId: null },
      isDragging: false,
      zoom: 1,
      initialized: false,
    });
    engine = new IntentEngine(() => createFakeHook());
    doc = createDocument('Intent Test');
    useEditorStore.getState().initDocument(doc);
  });

  // ---- 添加组件 ----

  describe('parse "添加一个按钮"', () => {
    it('should parse add button intent', () => {
      const ops = engine.parse('添加一个按钮');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('node.add');
      expect(ops[0].params.blockType).toBe(BlockType.Button);
      expect(ops[0].params.parentId).toBe(doc.rootId);
      expect(ops[0].description).toContain('按钮');
    });
  });

  describe('parse "在导航栏添加一个Logo"', () => {
    it('should parse add component to specific container', () => {
      const navbar = createContainerBlock([], { id: 'navbar', name: '导航栏' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [navbar.id];
      }
      doc.nodes = { ...doc.nodes, [navbar.id]: navbar };
      useEditorStore.getState().initDocument(doc);

      engine = new IntentEngine(() => createFakeHook());
      const ops = engine.parse('在导航栏添加一个Logo');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('node.add');
      expect(ops[0].params.blockType).toBe(BlockType.Image);
      expect(ops[0].params.parentId).toBe('navbar');
      expect(ops[0].description).toContain('Logo');
    });
  });

  // ---- 删除组件 ----

  describe('parse "删除按钮"', () => {
    it('should parse delete intent', () => {
      const btn = createButtonBlock('Click', { id: 'btn-1', name: '按钮' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [btn.id];
      }
      doc.nodes = { ...doc.nodes, [btn.id]: btn };
      useEditorStore.getState().initDocument(doc);

      engine = new IntentEngine(() => createFakeHook());
      const ops = engine.parse('删除按钮');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('node.remove');
      expect(ops[0].params.targetNodeId).toBe('btn-1');
      expect(ops[0].description).toContain('按钮');
    });
  });

  // ---- 修改样式 ----

  describe('parse "设置按钮的背景色为蓝色"', () => {
    it('should parse style update intent with Chinese color', () => {
      const btn = createButtonBlock('Click', { id: 'btn-1', name: '按钮' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [btn.id];
      }
      doc.nodes = { ...doc.nodes, [btn.id]: btn };
      useEditorStore.getState().initDocument(doc);

      engine = new IntentEngine(() => createFakeHook());
      const ops = engine.parse('设置按钮的背景色为蓝色');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('node.updateStyle');
      expect(ops[0].params.targetNodeId).toBe('btn-1');
      expect((ops[0].params as any).style.backgroundColor).toBe('#3b82f6');
      expect(ops[0].description).toContain('背景色');
    });
  });

  // ---- 居中 ----

  describe('parse "让登录表单居中"', () => {
    it('should parse center intent', () => {
      const form = createContainerBlock([], { id: 'form-1', name: '登录表单' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [form.id];
      }
      doc.nodes = { ...doc.nodes, [form.id]: form };
      useEditorStore.getState().initDocument(doc);

      engine = new IntentEngine(() => createFakeHook());
      const ops = engine.parse('让登录表单居中');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('spatial.center');
      expect(ops[0].params.targetNodeId).toBe('form-1');
      expect(ops[0].description).toContain('登录表单');
      expect(ops[0].description).toContain('居中');
    });
  });

  // ---- 设置布局方向 ----

  describe('parse "设置导航栏为水平布局"', () => {
    it('should parse layout direction intent', () => {
      const navbar = createContainerBlock([], { id: 'navbar', name: '导航栏' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [navbar.id];
      }
      doc.nodes = { ...doc.nodes, [navbar.id]: navbar };
      useEditorStore.getState().initDocument(doc);

      engine = new IntentEngine(() => createFakeHook());
      const ops = engine.parse('设置导航栏为水平布局');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('spatial.setLayout');
      expect(ops[0].params.targetNodeId).toBe('navbar');
      expect((ops[0].params as any).layout.flexDirection).toBe('row');
      expect(ops[0].description).toContain('水平');
    });
  });

  // ---- 移动节点 ----

  describe('parse "把按钮移到表单容器"', () => {
    it('should parse move intent', () => {
      const btn = createButtonBlock('Click', { id: 'btn-1', name: '按钮' });
      const form = createContainerBlock([], { id: 'form-1', name: '表单容器' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [btn.id, form.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [btn.id]: btn,
        [form.id]: form,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new IntentEngine(() => createFakeHook());
      const ops = engine.parse('把按钮移到表单容器');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('node.move');
      expect(ops[0].params.targetNodeId).toBe('btn-1');
      expect(ops[0].params.newParentId).toBe('form-1');
      expect(ops[0].description).toContain('按钮');
      expect(ops[0].description).toContain('表单容器');
    });
  });

  // ---- 设置间距 ----

  describe('parse "设置表单的间距为16px"', () => {
    it('should parse set gap intent', () => {
      const form = createContainerBlock([], { id: 'form-1', name: '表单' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [form.id];
      }
      doc.nodes = { ...doc.nodes, [form.id]: form };
      useEditorStore.getState().initDocument(doc);

      engine = new IntentEngine(() => createFakeHook());
      const ops = engine.parse('设置表单的间距为16px');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('spatial.setGap');
      expect(ops[0].params.targetNodeId).toBe('form-1');
      expect(ops[0].params.gap).toBe(16);
      expect(ops[0].description).toContain('间距');
    });
  });

  // ---- 设置尺寸 ----

  describe('parse "设置图片的宽度为100%"', () => {
    it('should parse set size intent', () => {
      const img = createImageBlock('test.png', { id: 'img-1', name: '图片' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [img.id];
      }
      doc.nodes = { ...doc.nodes, [img.id]: img };
      useEditorStore.getState().initDocument(doc);

      engine = new IntentEngine(() => createFakeHook());
      const ops = engine.parse('设置图片的宽度为100%');

      expect(ops).toHaveLength(1);
      // The engine parses width/height changes as style updates
      expect(ops[0].type).toBe('node.updateStyle');
      expect(ops[0].params.targetNodeId).toBe('img-1');
      expect((ops[0].params as any).style.width).toBe('100%');
      expect(ops[0].description).toContain('宽度');
    });
  });

  // ---- 应用预设 ----

  describe('parse "应用侧边栏布局"', () => {
    it('should parse apply preset intent', () => {
      const ops = engine.parse('应用侧边栏布局');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('spatial.applyPreset');
      expect(ops[0].params.presetName).toBe('侧边栏');
      expect(ops[0].description).toContain('侧边栏');
    });

    it('should target selected node for preset', () => {
      const container = createContainerBlock([], { id: 'c1', name: 'My Container' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);
      useEditorStore.getState().selectNode('c1');

      engine = new IntentEngine(() => createFakeHook());
      const ops = engine.parse('应用侧边栏布局');

      expect(ops).toHaveLength(1);
      expect(ops[0].params.targetNodeId).toBe('c1');
    });
  });

  // ---- 预览 ----

  describe('preview', () => {
    it('should preview without executing', () => {
      const btn = createButtonBlock('Click', { id: 'btn-1', name: '按钮' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [btn.id];
      }
      doc.nodes = { ...doc.nodes, [btn.id]: btn };
      useEditorStore.getState().initDocument(doc);

      engine = new IntentEngine(() => createFakeHook());
      const preview = engine.preview('设置按钮的背景色为红色');

      expect(preview.plannedOperations).toHaveLength(1);
      expect(preview.affectedNodes).toContain('btn-1');
      expect(preview.estimatedImpact).toContain('背景色');
    });

    it('should return empty preview for unknown intent', () => {
      const preview = engine.preview('xyzzy nothing here');

      expect(preview.plannedOperations).toHaveLength(0);
      expect(preview.affectedNodes).toHaveLength(0);
      expect(preview.estimatedImpact).toBe('无操作');
    });
  });

  // ---- 执行 ----

  describe('execute', () => {
    it('should execute add intent and create node', () => {
      const result = engine.execute('添加一个按钮');

      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].type).toBe('node.add');

      // Verify node was actually added to the store
      const state = useEditorStore.getState();
      const root = state.document!.nodes[doc.rootId];
      expect((root as any).props.children.length).toBeGreaterThan(0);
    });

    it('should execute style update intent', () => {
      const btn = createButtonBlock('Click', { id: 'btn-1', name: '按钮' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [btn.id];
      }
      doc.nodes = { ...doc.nodes, [btn.id]: btn };
      useEditorStore.getState().initDocument(doc);

      engine = new IntentEngine(() => createFakeHook());
      const result = engine.execute('设置按钮的背景色为红色');

      expect(result.success).toBe(true);

      // Verify style was applied
      const node = useEditorStore.getState().document!.nodes['btn-1'];
      expect(node.style.backgroundColor).toBe('#ef4444');
    });

    it('should return failure for unknown intent', () => {
      const result = engine.execute('this is not a valid intent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('无法解析');
    });

    it('should return failure when document is not initialized', () => {
      useEditorStore.setState({
        document: null,
        selection: { selectedIds: [], hoveredId: null },
        isDragging: false,
        zoom: 1,
        initialized: false,
      });

      engine = new IntentEngine(() => createFakeHook());
      const result = engine.execute('添加一个按钮');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // ---- 批量执行 ----

  describe('executeBatch', () => {
    it('should execute multiple intents in batch', () => {
      const result = engine.executeBatch([
        '添加一个按钮',
        '添加一个文本',
      ]);

      expect(result.success).toBe(true);
      expect(result.operations.length).toBe(2);

      // Verify both nodes were added
      const state = useEditorStore.getState();
      const root = state.document!.nodes[doc.rootId];
      expect((root as any).props.children.length).toBe(2);
    });

    it('should fail batch if any intent is invalid', () => {
      const result = engine.executeBatch([
        '添加一个按钮',
        'invalid intent that cannot be parsed',
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('无法解析');
    });
  });

  // ---- 未知意图 ----

  describe('unknown intent', () => {
    it('should return empty operations for unrecognized text', () => {
      const ops = engine.parse('this is random text with no intent');
      expect(ops).toHaveLength(0);
    });

    it('should return empty for empty string', () => {
      const ops = engine.parse('');
      expect(ops).toHaveLength(0);
    });

    it('should return empty for whitespace only', () => {
      const ops = engine.parse('   ');
      expect(ops).toHaveLength(0);
    });
  });

  // ---- 自定义解析器 ----

  describe('registerParser', () => {
    it('should allow registering custom parsers', () => {
      engine.registerParser(
        /自定义添加(.+)/,
        (match) => {
          return [{
            type: 'node.add' as const,
            params: { blockType: BlockType.Text, name: match[1] },
            description: `自定义添加 ${match[1]}`,
          }];
        },
      );

      const ops = engine.parse('自定义添加MyWidget');

      expect(ops).toHaveLength(1);
      expect(ops[0].params.name).toBe('MyWidget');
    });
  });
});
