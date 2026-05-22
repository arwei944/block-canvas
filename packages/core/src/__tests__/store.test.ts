import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import {
  createDocument,
  createTextBlock,
  createButtonBlock,
  createContainerBlock,
} from '../node';
import { BlockType } from '../types';
import type { BlockDocument } from '../types';

describe('EditorStore', () => {
  let doc: BlockDocument;

  beforeEach(() => {
    // Reset store state
    useEditorStore.setState({
      document: null,
      selection: { selectedIds: [], hoveredId: null },
      isDragging: false,
      zoom: 1,
      initialized: false,
    });

    // Create a fresh document
    doc = createDocument('Test');
    const textNode = createTextBlock('Hello', { name: 'Greeting' });
    const buttonNode = createButtonBlock('Click', { name: 'Action' });
    const containerNode = createContainerBlock([textNode.id, buttonNode.id], {
      name: 'Main Container',
    });

    // Update root children
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
  });

  describe('initial state', () => {
    it('should have correct initial state before initDocument', () => {
      useEditorStore.setState({
        document: null,
        selection: { selectedIds: [], hoveredId: null },
        isDragging: false,
        zoom: 1,
        initialized: false,
      });
      const state = useEditorStore.getState();
      expect(state.document).toBeNull();
      expect(state.selection.selectedIds).toEqual([]);
      expect(state.isDragging).toBe(false);
      expect(state.zoom).toBe(1);
      expect(state.initialized).toBe(false);
    });
  });

  describe('initDocument', () => {
    it('should set the document and mark as initialized', () => {
      const newDoc = createDocument('New Doc');
      useEditorStore.getState().initDocument(newDoc);
      const state = useEditorStore.getState();
      expect(state.document).toBe(newDoc);
      expect(state.initialized).toBe(true);
      expect(state.zoom).toBe(1);
      expect(state.selection.selectedIds).toEqual([]);
    });
  });

  describe('addNode', () => {
    it('should add a node to a parent container', () => {
      const state = useEditorStore.getState();
      const containerId = (doc.nodes[doc.rootId].props as any).children[0];
      const newNode = createTextBlock('New Node', { name: 'Added' });

      state.addNode(containerId, newNode);

      const updated = useEditorStore.getState();
      expect(updated.document!.nodes[newNode.id]).toBeDefined();
      expect(updated.document!.nodes[containerId].type).toBe(BlockType.Container);
      expect(
        (updated.document!.nodes[containerId] as any).props.children,
      ).toContain(newNode.id);
    });

    it('should not add node if parent is not a container', () => {
      const state = useEditorStore.getState();
      const textNodeId = Object.values(doc.nodes).find(
        (n) => n.type === BlockType.Text,
      )!.id;
      const newNode = createTextBlock('Invalid');

      state.addNode(textNodeId, newNode);

      const updated = useEditorStore.getState();
      expect(updated.document!.nodes[newNode.id]).toBeUndefined();
    });
  });

  describe('removeNode', () => {
    it('should remove a node and its children from the document', () => {
      const state = useEditorStore.getState();
      const containerId = (doc.nodes[doc.rootId].props as any).children[0];
      const container = doc.nodes[containerId] as any;
      const childId = container.props.children[0]; // text node

      state.removeNode(childId);

      const updated = useEditorStore.getState();
      expect(updated.document!.nodes[childId]).toBeUndefined();
      expect(
        (updated.document!.nodes[containerId] as any).props.children,
      ).not.toContain(childId);
    });

    it('should not remove the root node', () => {
      const state = useEditorStore.getState();
      const rootId = doc.rootId;
      const nodeCountBefore = Object.keys(doc.nodes).length;

      state.removeNode(rootId);

      const updated = useEditorStore.getState();
      expect(updated.document!.nodes[rootId]).toBeDefined();
      expect(Object.keys(updated.document!.nodes).length).toBe(nodeCountBefore);
    });
  });

  describe('updateNode', () => {
    it('should update node properties', () => {
      const state = useEditorStore.getState();
      const textNode = Object.values(doc.nodes).find(
        (n) => n.type === BlockType.Text,
      )!;

      state.updateNode(textNode.id, { name: 'Updated Name' });

      const updated = useEditorStore.getState();
      expect(updated.document!.nodes[textNode.id].name).toBe('Updated Name');
    });
  });

  describe('updateNodeStyle', () => {
    it('should merge style properties', () => {
      const state = useEditorStore.getState();
      const textNode = Object.values(doc.nodes).find(
        (n) => n.type === BlockType.Text,
      )!;

      state.updateNodeStyle(textNode.id, { fontSize: '20px', color: 'red' });

      const updated = useEditorStore.getState();
      const node = updated.document!.nodes[textNode.id];
      expect(node.style.fontSize).toBe('20px');
      expect(node.style.color).toBe('red');
    });

    it('should preserve existing style properties when merging', () => {
      const state = useEditorStore.getState();
      const textNode = Object.values(doc.nodes).find(
        (n) => n.type === BlockType.Text,
      )!;
      const originalStyle = { ...textNode.style };

      state.updateNodeStyle(textNode.id, { fontSize: '20px' });

      const updated = useEditorStore.getState();
      const node = updated.document!.nodes[textNode.id];
      // Existing style properties should be preserved
      for (const key of Object.keys(originalStyle)) {
        if (key !== 'fontSize') {
          expect((node.style as any)[key]).toBe((originalStyle as any)[key]);
        }
      }
    });
  });

  describe('moveNode', () => {
    it('should move a node to a new parent container', () => {
      const state = useEditorStore.getState();
      const containerId = (doc.nodes[doc.rootId].props as any).children[0];
      const container = doc.nodes[containerId] as any;
      const childId = container.props.children[0]; // text node

      // Create a new container and add it to root
      const newContainer = createContainerBlock([], { name: 'Target' });
      state.addNode(doc.rootId, newContainer);

      // Move text node to new container
      state.moveNode(childId, newContainer.id);

      const updated = useEditorStore.getState();
      expect(
        (updated.document!.nodes[newContainer.id] as any).props.children,
      ).toContain(childId);
      expect(
        (updated.document!.nodes[containerId] as any).props.children,
      ).not.toContain(childId);
    });
  });

  describe('selectNode', () => {
    it('should select a single node', () => {
      const state = useEditorStore.getState();
      const textNode = Object.values(doc.nodes).find(
        (n) => n.type === BlockType.Text,
      )!;

      state.selectNode(textNode.id);

      const updated = useEditorStore.getState();
      expect(updated.selection.selectedIds).toEqual([textNode.id]);
    });

    it('should support multi-select', () => {
      const state = useEditorStore.getState();
      const nodes = Object.values(doc.nodes);
      const textNode = nodes.find((n) => n.type === BlockType.Text)!;
      const buttonNode = nodes.find((n) => n.type === BlockType.Button)!;

      state.selectNode(textNode.id);
      state.selectNode(buttonNode.id, true);

      const updated = useEditorStore.getState();
      expect(updated.selection.selectedIds).toHaveLength(2);
      expect(updated.selection.selectedIds).toContain(textNode.id);
      expect(updated.selection.selectedIds).toContain(buttonNode.id);
    });

    it('should toggle node in multi-select mode', () => {
      const state = useEditorStore.getState();
      const textNode = Object.values(doc.nodes).find(
        (n) => n.type === BlockType.Text,
      )!;

      state.selectNode(textNode.id);
      state.selectNode(textNode.id, true); // toggle off

      const updated = useEditorStore.getState();
      expect(updated.selection.selectedIds).toEqual([]);
    });
  });

  describe('clearSelection', () => {
    it('should clear all selected nodes', () => {
      const state = useEditorStore.getState();
      const textNode = Object.values(doc.nodes).find(
        (n) => n.type === BlockType.Text,
      )!;

      state.selectNode(textNode.id);
      expect(useEditorStore.getState().selection.selectedIds).toHaveLength(1);

      state.clearSelection();
      expect(useEditorStore.getState().selection.selectedIds).toEqual([]);
    });
  });
});
