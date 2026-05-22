import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { SnapshotEngine } from '../snapshot/snapshot-engine';
import {
  createDocument,
  createTextBlock,
  createButtonBlock,
  createImageBlock,
  createContainerBlock,
} from '../node';
import { BlockType } from '../types';
import type { EditorStore } from '../store/types';

/**
 * In Node.js test environment, zustand hooks cannot be called directly
 * because they require React context. We use getState() instead.
 */
function createStore(): EditorStore {
  return useEditorStore.getState() as unknown as EditorStore;
}

describe('SnapshotEngine', () => {
  let engine: SnapshotEngine;

  beforeEach(() => {
    useEditorStore.setState({
      document: null,
      selection: { selectedIds: [], hoveredId: null },
      isDragging: false,
      zoom: 1,
      initialized: false,
    });
    engine = new SnapshotEngine(createStore());
  });

  // ---- 空文档 ----

  describe('empty document', () => {
    it('should return empty snapshot when no document is set', () => {
      const snapshot = engine.getSnapshot();

      expect(snapshot.canvas.width).toBe(0);
      expect(snapshot.canvas.height).toBe(0);
      expect(snapshot.canvas.nodeCount).toBe(0);
      expect(snapshot.nodes).toHaveLength(0);
      expect(snapshot.tree.id).toBe('');
      expect(snapshot.tree.children).toHaveLength(0);
    });

    it('should return message when no document is set', () => {
      const desc = engine.getDescription();
      expect(desc).toBe('当前没有打开的文档。');
    });
  });

  // ---- 结构化快照 ----

  describe('getSnapshot', () => {
    it('should generate summary snapshot', () => {
      const doc = createDocument('Test Doc');
      const textNode = createTextBlock('Hello World', {
        id: 'text-1',
        name: 'Greeting',
        style: { width: '200px', height: '50px' },
      });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [textNode.id];
      }
      doc.nodes = { ...doc.nodes, [textNode.id]: textNode };
      useEditorStore.getState().initDocument(doc);

      // Recreate engine with fresh store reference
      engine = new SnapshotEngine(createStore());

      const snapshot = engine.getSnapshot({ detail: 'summary' });

      expect(snapshot.canvas.nodeCount).toBe(2); // root + text
      expect(snapshot.nodes).toHaveLength(2);

      const textEntry = snapshot.nodes.find((n) => n.id === 'text-1');
      expect(textEntry).toBeDefined();
      expect(textEntry!.type).toBe('text');
      expect(textEntry!.name).toBe('Greeting');
      // Summary mode should not include style
      expect(textEntry!.style).toBeUndefined();
      expect(textEntry!.bounds).toBeUndefined();
    });

    it('should generate full snapshot with styles', () => {
      const doc = createDocument('Test Doc');
      const textNode = createTextBlock('Hello', {
        id: 'text-1',
        name: 'Styled Text',
        style: { width: '200px', height: '50px', backgroundColor: '#ff0000' },
      });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [textNode.id];
      }
      doc.nodes = { ...doc.nodes, [textNode.id]: textNode };
      useEditorStore.getState().initDocument(doc);

      engine = new SnapshotEngine(createStore());

      const snapshot = engine.getSnapshot({ includeStyles: true });

      const textEntry = snapshot.nodes.find((n) => n.id === 'text-1');
      expect(textEntry!.style).toBeDefined();
      expect(textEntry!.style!.backgroundColor).toBe('#ff0000');
      expect(textEntry!.style!.width).toBe('200px');
    });

    it('should generate snapshot with layout bounds', () => {
      const doc = createDocument('Test Doc');
      const textNode = createTextBlock('Hello', {
        id: 'text-1',
        name: 'Positioned Text',
        style: { width: '100px', height: '40px' },
        layout: { left: 10, top: 20 },
      });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [textNode.id];
      }
      doc.nodes = { ...doc.nodes, [textNode.id]: textNode };
      useEditorStore.getState().initDocument(doc);

      engine = new SnapshotEngine(createStore());

      const snapshot = engine.getSnapshot({ includeLayout: true });

      const textEntry = snapshot.nodes.find((n) => n.id === 'text-1');
      expect(textEntry!.bounds).toBeDefined();
      expect(textEntry!.bounds!.x).toBe(10);
      expect(textEntry!.bounds!.y).toBe(20);
      expect(textEntry!.bounds!.width).toBe(100);
      expect(textEntry!.bounds!.height).toBe(40);
    });

    it('should extract text content for text nodes', () => {
      const doc = createDocument('Test Doc');
      const textNode = createTextBlock('My Content', {
        id: 'text-1',
        name: 'My Text',
      });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [textNode.id];
      }
      doc.nodes = { ...doc.nodes, [textNode.id]: textNode };
      useEditorStore.getState().initDocument(doc);

      engine = new SnapshotEngine(createStore());

      const snapshot = engine.getSnapshot();

      const textEntry = snapshot.nodes.find((n) => n.id === 'text-1');
      expect(textEntry!.textContent).toBe('My Content');
    });

    it('should extract label for button nodes', () => {
      const doc = createDocument('Test Doc');
      const btnNode = createButtonBlock('Click Me', {
        id: 'btn-1',
        name: 'My Button',
      });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [btnNode.id];
      }
      doc.nodes = { ...doc.nodes, [btnNode.id]: btnNode };
      useEditorStore.getState().initDocument(doc);

      engine = new SnapshotEngine(createStore());

      const snapshot = engine.getSnapshot();

      const btnEntry = snapshot.nodes.find((n) => n.id === 'btn-1');
      expect(btnEntry!.textContent).toBe('Click Me');
    });

    it('should build correct tree structure', () => {
      const doc = createDocument('Test Doc');
      const container = createContainerBlock([], { id: 'container-1', name: 'Wrapper' });
      const textNode = createTextBlock('Hello', { id: 'text-1', name: 'Child Text' });

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

      engine = new SnapshotEngine(createStore());

      const snapshot = engine.getSnapshot();

      // Root tree
      expect(snapshot.tree.id).toBe(doc.rootId);
      expect(snapshot.tree.children).toHaveLength(1);

      // Container in tree
      const containerTree = snapshot.tree.children[0];
      expect(containerTree.id).toBe('container-1');
      expect(containerTree.name).toBe('Wrapper');
      expect(containerTree.children).toHaveLength(1);

      // Text in tree
      const textTree = containerTree.children[0];
      expect(textTree.id).toBe('text-1');
      expect(textTree.name).toBe('Child Text');
      expect(textTree.children).toHaveLength(0);
    });

    it('should report correct canvas dimensions from root node', () => {
      const doc = createDocument('Test Doc');
      const rootNode = doc.nodes[doc.rootId];
      rootNode.style = { ...rootNode.style, width: '1024px', height: '768px' };
      useEditorStore.getState().initDocument(doc);

      engine = new SnapshotEngine(createStore());

      const snapshot = engine.getSnapshot();

      expect(snapshot.canvas.width).toBe(1024);
      expect(snapshot.canvas.height).toBe(768);
    });

    it('should include children list for container nodes', () => {
      const doc = createDocument('Test Doc');
      const container = createContainerBlock(['t1', 't2'], { id: 'c1' });
      const textA = createTextBlock('A', { id: 't1' });
      const textB = createTextBlock('B', { id: 't2' });

      container.props.children = [textA.id, textB.id];
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [container.id]: container,
        [textA.id]: textA,
        [textB.id]: textB,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new SnapshotEngine(createStore());

      const snapshot = engine.getSnapshot();

      const containerEntry = snapshot.nodes.find((n) => n.id === 'c1');
      expect(containerEntry!.children).toEqual(['t1', 't2']);

      const textEntry = snapshot.nodes.find((n) => n.id === 't1');
      expect(textEntry!.children).toEqual([]);
    });
  });

  // ---- 自然语言描述 ----

  describe('getDescription', () => {
    it('should generate concise description', () => {
      const doc = createDocument('Test Doc');
      const textNode = createTextBlock('Hello', { id: 'text-1', name: 'Greeting' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [textNode.id];
      }
      doc.nodes = { ...doc.nodes, [textNode.id]: textNode };
      useEditorStore.getState().initDocument(doc);

      engine = new SnapshotEngine(createStore());

      const desc = engine.getDescription({ style: 'concise' });

      expect(desc).toContain('2 个节点');
      expect(desc).toContain('Greeting');
      expect(desc).toContain('[Text]');
      expect(desc).toContain('检测到 0 个布局问题');
    });

    it('should generate detailed description with style info', () => {
      const doc = createDocument('Test Doc');
      const textNode = createTextBlock('Hello', {
        id: 'text-1',
        name: 'Styled',
        style: { width: '200px', height: '50px', backgroundColor: '#ff0000' },
      });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [textNode.id];
      }
      doc.nodes = { ...doc.nodes, [textNode.id]: textNode };
      useEditorStore.getState().initDocument(doc);

      engine = new SnapshotEngine(createStore());

      const desc = engine.getDescription({ style: 'detailed' });

      expect(desc).toContain('w=200px');
      expect(desc).toContain('h=50px');
      expect(desc).toContain('bg=#ff0000');
    });

    it('should describe empty root node', () => {
      const doc = createDocument('Empty Doc');
      useEditorStore.getState().initDocument(doc);

      engine = new SnapshotEngine(createStore());

      const desc = engine.getDescription();

      expect(desc).toContain('1 个节点');
      expect(desc).toContain('没有子节点');
    });

    it('should describe nested structure', () => {
      const doc = createDocument('Nested Doc');
      const container = createContainerBlock([], { id: 'c1', name: 'Outer' });
      const innerContainer = createContainerBlock([], { id: 'c2', name: 'Inner' });
      const textNode = createTextBlock('Deep', { id: 't1', name: 'Deep Text' });

      innerContainer.props.children = [textNode.id];
      container.props.children = [innerContainer.id];
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [container.id]: container,
        [innerContainer.id]: innerContainer,
        [textNode.id]: textNode,
      };
      useEditorStore.getState().initDocument(doc);

      engine = new SnapshotEngine(createStore());

      const desc = engine.getDescription({ style: 'concise' });

      expect(desc).toContain('4 个节点');
      // Concise mode shows first-level children only
      expect(desc).toContain('Outer');
    });
  });
});
