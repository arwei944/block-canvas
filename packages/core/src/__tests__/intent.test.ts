import { describe, it, expect, beforeEach } from 'vitest';
import { IntentEngine } from '../intent/intent-engine';
import { useEditorStore } from '../store/editor-store';
import {
  createDocument,
  createTextBlock,
  createButtonBlock,
  createContainerBlock,
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
  beforeEach(() => {
    useEditorStore.setState({
      document: null,
      selection: { selectedIds: [], hoveredId: null },
      isDragging: false,
      zoom: 1,
      initialized: false,
    });
  });

  function createEngine(): IntentEngine {
    return new IntentEngine(() => createFakeHook());
  }

  function setupDoc() {
    const doc = createDocument('Test');
    // Use Chinese names so that findNodeByName can match intent parsing targets
    const buttonNode = createButtonBlock('Click', { name: '按钮' });
    const formContainer = createContainerBlock([], { name: '登录表单' });

    const rootNode = doc.nodes[doc.rootId];
    if (rootNode && rootNode.type === BlockType.Container) {
      rootNode.props.children = [buttonNode.id, formContainer.id];
    }

    doc.nodes = {
      ...doc.nodes,
      [buttonNode.id]: buttonNode,
      [formContainer.id]: formContainer,
    };

    useEditorStore.getState().initDocument(doc);
    return { doc, buttonNode, formContainer };
  }

  describe('parse', () => {
    it('should parse "添加一个按钮" as node.add operation', () => {
      setupDoc();
      const engine = createEngine();
      const ops = engine.parse('添加一个按钮');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('node.add');
      expect(ops[0].params.blockType).toBe(BlockType.Button);
    });

    it('should parse "设置按钮的背景色为蓝色" as node.updateStyle operation', () => {
      const { buttonNode } = setupDoc();
      const engine = createEngine();
      const ops = engine.parse('设置按钮的背景色为蓝色');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('node.updateStyle');
      expect(ops[0].params.targetNodeId).toBe(buttonNode.id);
      expect(ops[0].params.style).toEqual({ backgroundColor: '#3b82f6' });
    });

    it('should parse "让登录表单居中" as spatial.center operation', () => {
      const { formContainer } = setupDoc();
      const engine = createEngine();
      const ops = engine.parse('让登录表单居中');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('spatial.center');
      expect(ops[0].params.targetNodeId).toBe(formContainer.id);
    });

    it('should parse "设置导航栏为水平布局" as spatial.setLayout operation', () => {
      setupDoc();
      const doc = useEditorStore.getState().document!;
      const navNode = createContainerBlock([], { name: '导航栏' });
      useEditorStore.getState().addNode(doc.rootId, navNode);

      const engine = createEngine();
      const ops = engine.parse('设置导航栏为水平布局');

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe('spatial.setLayout');
      expect(ops[0].params.targetNodeId).toBe(navNode.id);
      expect(ops[0].params.layout).toEqual({ flexDirection: 'row' });
    });

    it('should return empty array for unparseable intent', () => {
      setupDoc();
      const engine = createEngine();
      const ops = engine.parse('xyzzy nothing here');
      expect(ops).toEqual([]);
    });
  });

  describe('preview', () => {
    it('should return preview info with planned operations', () => {
      setupDoc();
      const engine = createEngine();
      const preview = engine.preview('添加一个按钮');

      expect(preview.plannedOperations).toHaveLength(1);
      expect(preview.plannedOperations[0].type).toBe('node.add');
      expect(preview.estimatedImpact).toBeTruthy();
    });

    it('should return empty preview for unparseable intent', () => {
      setupDoc();
      const engine = createEngine();
      const preview = engine.preview('xyzzy');

      expect(preview.plannedOperations).toHaveLength(0);
      expect(preview.estimatedImpact).toBe('无操作');
    });
  });

  describe('execute', () => {
    it('should execute a node.add operation and return success', () => {
      setupDoc();
      const engine = createEngine();
      const result = engine.execute('添加一个按钮');

      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].type).toBe('node.add');
    });

    it('should return error for unparseable intent', () => {
      setupDoc();
      const engine = createEngine();
      const result = engine.execute('xyzzy');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should return error when no document is initialized', () => {
      // When no document is initialized, parse returns [] because
      // the handler cannot find a document. execute then returns
      // "无法解析该意图" since no operations were parsed.
      const engine = createEngine();
      const result = engine.execute('添加一个按钮');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should actually add a node to the document', () => {
      const { doc } = setupDoc();
      const nodeCountBefore = Object.keys(doc.nodes).length;

      const engine = createEngine();
      engine.execute('添加一个按钮');

      const state = useEditorStore.getState();
      const nodeCountAfter = Object.keys(state.document!.nodes).length;
      expect(nodeCountAfter).toBe(nodeCountBefore + 1);
    });
  });
});
