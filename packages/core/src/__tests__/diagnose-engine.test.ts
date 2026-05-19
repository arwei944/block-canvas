import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { DiagnoseEngine } from '../diagnose/diagnose-engine';
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

describe('DiagnoseEngine', () => {
  let engine: DiagnoseEngine;

  beforeEach(() => {
    useEditorStore.setState({
      document: null,
      selection: { selectedIds: [], hoveredId: null },
      isDragging: false,
      zoom: 1,
      initialized: false,
    });
    engine = new DiagnoseEngine(() => createFakeHook());
  });

  // ---- 健康布局 ----

  describe('healthy layout', () => {
    it('should return empty issues for healthy layout', () => {
      const doc = createDocument('Healthy');
      const textNode = createTextBlock('Hello', {
        id: 'text-1',
        name: 'Normal Text',
        style: { width: '200px', height: '40px' },
      });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [textNode.id];
      }
      doc.nodes = { ...doc.nodes, [textNode.id]: textNode };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();

      expect(report.issues).toHaveLength(0);
      expect(report.summary).toBe('未检测到布局问题。');
    });
  });

  // ---- 重叠检测 ----

  describe('detect overlapping nodes', () => {
    it('should detect overlapping absolutely positioned nodes', () => {
      const doc = createDocument('Overlap Test');
      const nodeA = createTextBlock('A', {
        id: 'node-a',
        name: 'Node A',
        style: { position: 'absolute', left: 0, top: 0, width: '100px', height: '100px' },
      });
      const nodeB = createTextBlock('B', {
        id: 'node-b',
        name: 'Node B',
        style: { position: 'absolute', left: 50, top: 50, width: '100px', height: '100px' },
      });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [nodeA.id, nodeB.id];
      }
      doc.nodes = { ...doc.nodes, [nodeA.id]: nodeA, [nodeB.id]: nodeB };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();

      const overlapIssues = report.issues.filter((i) => i.type === 'overlap');
      expect(overlapIssues.length).toBeGreaterThan(0);
      expect(overlapIssues[0].severity).toBe('warning');
      expect(overlapIssues[0].nodeIds).toContain('node-a');
      expect(overlapIssues[0].nodeIds).toContain('node-b');
    });

    it('should not flag non-overlapping nodes', () => {
      const doc = createDocument('No Overlap');
      const nodeA = createTextBlock('A', {
        id: 'node-a',
        style: { position: 'absolute', left: 0, top: 0, width: '100px', height: '100px' },
      });
      const nodeB = createTextBlock('B', {
        id: 'node-b',
        style: { position: 'absolute', left: 200, top: 200, width: '100px', height: '100px' },
      });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [nodeA.id, nodeB.id];
      }
      doc.nodes = { ...doc.nodes, [nodeA.id]: nodeA, [nodeB.id]: nodeB };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();
      const overlapIssues = report.issues.filter((i) => i.type === 'overlap');
      expect(overlapIssues).toHaveLength(0);
    });
  });

  // ---- 溢出检测 ----

  describe('detect overflow', () => {
    it('should detect container overflow', () => {
      const doc = createDocument('Overflow Test');
      const container = createContainerBlock([], {
        id: 'container-1',
        name: 'Small Container',
        style: { height: '50px' },
      });
      const tallChild = createTextBlock('Tall', {
        id: 'child-1',
        name: 'Tall Child',
        style: { height: '40px' },
      });
      const tallChild2 = createTextBlock('Tall2', {
        id: 'child-2',
        name: 'Tall Child 2',
        style: { height: '40px' },
      });

      container.props.children = [tallChild.id, tallChild2.id];
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [container.id]: container,
        [tallChild.id]: tallChild,
        [tallChild2.id]: tallChild2,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();

      const overflowIssues = report.issues.filter((i) => i.type === 'overflow');
      expect(overflowIssues.length).toBeGreaterThan(0);
      expect(overflowIssues[0].nodeIds).toContain('container-1');
      expect(overflowIssues[0].severity).toBe('warning');
    });

    it('should not flag containers with overflow hidden', () => {
      const doc = createDocument('Overflow Hidden');
      const container = createContainerBlock([], {
        id: 'container-1',
        style: { height: '50px', overflow: 'hidden' },
      });
      const tallChild = createTextBlock('Tall', {
        id: 'child-1',
        style: { height: '100px' },
      });

      container.props.children = [tallChild.id];
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [container.id]: container,
        [tallChild.id]: tallChild,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();
      const overflowIssues = report.issues.filter((i) => i.type === 'overflow');
      expect(overflowIssues).toHaveLength(0);
    });
  });

  // ---- 对齐检测 ----

  describe('detect misalignment', () => {
    it('should detect inconsistent text alignment among siblings', () => {
      const doc = createDocument('Misalign Test');
      const textA = createTextBlock('A', { id: 'text-a', style: { textAlign: 'left' } });
      const textB = createTextBlock('B', { id: 'text-b', style: { textAlign: 'center' } });
      const textC = createTextBlock('C', { id: 'text-c', style: { textAlign: 'right' } });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [textA.id, textB.id, textC.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [textA.id]: textA,
        [textB.id]: textB,
        [textC.id]: textC,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();

      const alignIssues = report.issues.filter((i) => i.type === 'misalignment');
      expect(alignIssues.length).toBeGreaterThan(0);
      expect(alignIssues[0].severity).toBe('info');
    });

    it('should not flag consistent alignment', () => {
      const doc = createDocument('Aligned');
      const textA = createTextBlock('A', { id: 'text-a', style: { textAlign: 'center' } });
      const textB = createTextBlock('B', { id: 'text-b', style: { textAlign: 'center' } });
      const textC = createTextBlock('C', { id: 'text-c', style: { textAlign: 'center' } });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [textA.id, textB.id, textC.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [textA.id]: textA,
        [textB.id]: textB,
        [textC.id]: textC,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();
      const alignIssues = report.issues.filter((i) => i.type === 'misalignment');
      expect(alignIssues).toHaveLength(0);
    });
  });

  // ---- 样式不一致检测 ----

  describe('detect style inconsistency', () => {
    it('should detect inconsistent heights among same type nodes', () => {
      const doc = createDocument('Inconsistency Test');
      const btn1 = createButtonBlock('A', { id: 'btn-1', style: { height: '40px' } });
      const btn2 = createButtonBlock('B', { id: 'btn-2', style: { height: '40px' } });
      const btn3 = createButtonBlock('C', { id: 'btn-3', style: { height: '80px' } });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [btn1.id, btn2.id, btn3.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [btn1.id]: btn1,
        [btn2.id]: btn2,
        [btn3.id]: btn3,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();

      const inconsistencyIssues = report.issues.filter((i) => i.type === 'inconsistency');
      expect(inconsistencyIssues.length).toBeGreaterThan(0);
      expect(inconsistencyIssues[0].severity).toBe('info');
      expect(inconsistencyIssues[0].nodeIds).toContain('btn-3');
    });

    it('should detect inconsistent border radius', () => {
      const doc = createDocument('Radius Test');
      const btn1 = createButtonBlock('A', { id: 'btn-1', style: { borderRadius: '8px' } });
      const btn2 = createButtonBlock('B', { id: 'btn-2', style: { borderRadius: '8px' } });
      const btn3 = createButtonBlock('C', { id: 'btn-3', style: { borderRadius: '16px' } });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [btn1.id, btn2.id, btn3.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [btn1.id]: btn1,
        [btn2.id]: btn2,
        [btn3.id]: btn3,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();

      const inconsistencyIssues = report.issues.filter((i) => i.type === 'inconsistency');
      expect(inconsistencyIssues.length).toBeGreaterThan(0);
    });
  });

  // ---- 空容器检测 ----

  describe('detect empty containers', () => {
    it('should detect empty containers', () => {
      const doc = createDocument('Empty Container Test');
      const emptyContainer = createContainerBlock([], {
        id: 'empty-1',
        name: 'Empty Box',
      });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [emptyContainer.id];
      }
      doc.nodes = { ...doc.nodes, [emptyContainer.id]: emptyContainer };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();

      const emptyIssues = report.issues.filter((i) => i.type === 'empty-container');
      expect(emptyIssues.length).toBeGreaterThan(0);
      expect(emptyIssues[0].severity).toBe('warning');
      expect(emptyIssues[0].nodeIds).toContain('empty-1');
    });

    it('should not flag root node as empty container', () => {
      const doc = createDocument('Root Only');
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();
      const emptyIssues = report.issues.filter((i) => i.type === 'empty-container');
      expect(emptyIssues).toHaveLength(0);
    });

    it('should not flag non-empty containers', () => {
      const doc = createDocument('Non-Empty');
      const container = createContainerBlock([], { id: 'c1' });
      const textNode = createTextBlock('Hello', { id: 't1' });

      container.props.children = [textNode.id];
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [container.id]: container,
        [textNode.id]: textNode,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();
      const emptyIssues = report.issues.filter((i) => i.type === 'empty-container');
      expect(emptyIssues).toHaveLength(0);
    });
  });

  // ---- 深层嵌套检测 ----

  describe('detect deep nesting', () => {
    it('should detect nesting deeper than 5 levels', () => {
      const doc = createDocument('Deep Nest');
      let parentId = doc.rootId;
      const containerIds: string[] = [];
      for (let i = 1; i <= 6; i++) {
        const id = `c${i}`;
        containerIds.push(id);
        const container = createContainerBlock([], { id, name: `Level ${i}` });
        doc.nodes = { ...doc.nodes, [id]: container };

        const parent = doc.nodes[parentId];
        if (parent && parent.type === BlockType.Container) {
          parent.props.children = [id];
        }
        parentId = id;
      }

      useEditorStore.getState().initDocument(doc);
      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();

      const deepIssues = report.issues.filter((i) => i.type === 'deep-nesting');
      expect(deepIssues.length).toBeGreaterThan(0);
      expect(deepIssues[0].severity).toBe('warning');
    });

    it('should not flag shallow nesting', () => {
      const doc = createDocument('Shallow Nest');
      const c1 = createContainerBlock([], { id: 'c1' });
      const c2 = createContainerBlock([], { id: 'c2' });

      c1.props.children = [c2.id];
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [c1.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [c1.id]: c1,
        [c2.id]: c2,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();
      const deepIssues = report.issues.filter((i) => i.type === 'deep-nesting');
      expect(deepIssues).toHaveLength(0);
    });
  });

  // ---- 小元素检测 ----

  describe('detect tiny elements', () => {
    it('should detect elements with width < 20px', () => {
      const doc = createDocument('Tiny Width');
      const tinyNode = createTextBlock('X', {
        id: 'tiny-1',
        name: 'Tiny',
        style: { width: '10px' },
      });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [tinyNode.id];
      }
      doc.nodes = { ...doc.nodes, [tinyNode.id]: tinyNode };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();

      const tinyIssues = report.issues.filter((i) => i.type === 'tiny-element');
      expect(tinyIssues.length).toBeGreaterThan(0);
      expect(tinyIssues[0].severity).toBe('info');
      expect(tinyIssues[0].nodeIds).toContain('tiny-1');
    });

    it('should detect elements with height < 20px', () => {
      const doc = createDocument('Tiny Height');
      const tinyNode = createTextBlock('X', {
        id: 'tiny-1',
        name: 'Tiny',
        style: { height: '5px' },
      });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [tinyNode.id];
      }
      doc.nodes = { ...doc.nodes, [tinyNode.id]: tinyNode };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();

      const tinyIssues = report.issues.filter((i) => i.type === 'tiny-element');
      expect(tinyIssues.length).toBeGreaterThan(0);
    });

    it('should not flag elements >= 20px', () => {
      const doc = createDocument('Normal Size');
      const normalNode = createTextBlock('OK', {
        id: 'normal-1',
        style: { width: '100px', height: '40px' },
      });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [normalNode.id];
      }
      doc.nodes = { ...doc.nodes, [normalNode.id]: normalNode };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();
      const tinyIssues = report.issues.filter((i) => i.type === 'tiny-element');
      expect(tinyIssues).toHaveLength(0);
    });
  });

  // ---- 综合报告 ----

  describe('diagnostic report', () => {
    it('should include summary with correct counts', () => {
      const doc = createDocument('Multi Issue');
      const emptyContainer = createContainerBlock([], { id: 'empty-1' });
      const tinyNode = createTextBlock('X', {
        id: 'tiny-1',
        style: { width: '5px' },
      });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [emptyContainer.id, tinyNode.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [emptyContainer.id]: emptyContainer,
        [tinyNode.id]: tinyNode,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new DiagnoseEngine(() => createFakeHook());
      const report = engine.diagnose();

      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.summary).toContain('问题');
    });
  });
});
