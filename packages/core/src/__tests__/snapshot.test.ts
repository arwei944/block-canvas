import { describe, it, expect, beforeEach } from 'vitest';
import { SnapshotEngine } from '../snapshot/snapshot-engine';
import { useEditorStore } from '../store/editor-store';
import {
  createDocument,
  createTextBlock,
  createButtonBlock,
  createContainerBlock,
} from '../node';
import { BlockType } from '../types';
import type { EditorStore } from '../store/types';

describe('SnapshotEngine', () => {
  beforeEach(() => {
    useEditorStore.setState({
      document: null,
      selection: { selectedIds: [], hoveredId: null },
      isDragging: false,
      zoom: 1,
      initialized: false,
    });
  });

  describe('getSnapshot', () => {
    it('should return correct structure for empty document', () => {
      const doc = createDocument('Empty Doc');
      useEditorStore.getState().initDocument(doc);

      const engine = new SnapshotEngine(useEditorStore.getState() as unknown as EditorStore);
      const snapshot = engine.getSnapshot();

      expect(snapshot).toHaveProperty('canvas');
      expect(snapshot).toHaveProperty('nodes');
      expect(snapshot).toHaveProperty('tree');
      expect(snapshot.canvas.nodeCount).toBe(1); // root only
      expect(snapshot.nodes).toHaveLength(1);
      expect(snapshot.tree.id).toBe(doc.rootId);
      expect(snapshot.tree.type).toBe(BlockType.Container);
    });

    it('should return correct structure with nodes', () => {
      const doc = createDocument('Test Doc');
      const textNode = createTextBlock('Hello', { name: 'Title' });
      const buttonNode = createButtonBlock('Click', { name: 'Action' });
      const containerNode = createContainerBlock([textNode.id, buttonNode.id], {
        name: 'Main',
      });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [containerNode.id];
      }

      doc.nodes = {
        ...doc.nodes,
        [textNode.id]: textNode,
        [buttonNode.id]: buttonNode,
        [containerNode.id]: containerNode,
      };

      useEditorStore.getState().initDocument(doc);

      const engine = new SnapshotEngine(useEditorStore.getState() as unknown as EditorStore);
      const snapshot = engine.getSnapshot();

      expect(snapshot.canvas.nodeCount).toBe(4);
      expect(snapshot.nodes).toHaveLength(4);
      expect(snapshot.tree.children).toHaveLength(1);
      expect(snapshot.tree.children[0].children).toHaveLength(2);
    });

    it('should include styles when includeStyles is true', () => {
      const doc = createDocument('Styled Doc');
      useEditorStore.getState().initDocument(doc);

      const engine = new SnapshotEngine(useEditorStore.getState() as unknown as EditorStore);
      const snapshot = engine.getSnapshot({ includeStyles: true });

      const rootNode = snapshot.nodes.find((n) => n.id === doc.rootId);
      expect(rootNode).toBeDefined();
      expect(rootNode!.style).toBeDefined();
    });

    it('should return empty snapshot when no document', () => {
      const engine = new SnapshotEngine(useEditorStore.getState() as unknown as EditorStore);
      const snapshot = engine.getSnapshot();

      expect(snapshot.canvas.width).toBe(0);
      expect(snapshot.canvas.height).toBe(0);
      expect(snapshot.canvas.nodeCount).toBe(0);
      expect(snapshot.nodes).toHaveLength(0);
      expect(snapshot.tree.id).toBe('');
    });
  });

  describe('getDescription', () => {
    it('should return non-empty string for a document', () => {
      const doc = createDocument('Test Doc');
      useEditorStore.getState().initDocument(doc);

      const engine = new SnapshotEngine(useEditorStore.getState() as unknown as EditorStore);
      const desc = engine.getDescription();

      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    });

    it('should return message when no document is loaded', () => {
      const engine = new SnapshotEngine(useEditorStore.getState() as unknown as EditorStore);
      const desc = engine.getDescription();

      expect(desc).toBe('当前没有打开的文档。');
    });

    it('should describe nodes in detailed mode', () => {
      const doc = createDocument('Test Doc');
      const textNode = createTextBlock('Hello', {
        name: 'Title',
        style: { width: '200px', backgroundColor: '#fff' },
      });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [textNode.id];
      }
      doc.nodes = { ...doc.nodes, [textNode.id]: textNode };
      useEditorStore.getState().initDocument(doc);

      const engine = new SnapshotEngine(useEditorStore.getState() as unknown as EditorStore);
      const desc = engine.getDescription({ style: 'detailed' });

      expect(desc).toContain('Title');
      expect(desc).toContain('w=200px');
      expect(desc).toContain('bg=#fff');
    });

    it('should handle empty root container', () => {
      const doc = createDocument('Empty');
      useEditorStore.getState().initDocument(doc);

      const engine = new SnapshotEngine(useEditorStore.getState() as unknown as EditorStore);
      const desc = engine.getDescription();

      expect(desc).toContain('没有子节点');
    });
  });
});
