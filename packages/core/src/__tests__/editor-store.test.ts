import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { createDocument, createTextBlock, createButtonBlock, createContainerBlock, createImageBlock } from '../node';
import { BlockType } from '../types';

describe('EditorStore', () => {
  beforeEach(() => {
    // Reset the zustand store to initial state before each test
    useEditorStore.setState({
      document: null,
      selection: { selectedIds: [], hoveredId: null },
      isDragging: false,
      zoom: 1,
      initialized: false,
    });
  });

  // ---- 初始化 ----

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const state = useEditorStore.getState();
      expect(state.document).toBeNull();
      expect(state.selection.selectedIds).toEqual([]);
      expect(state.selection.hoveredId).toBeNull();
      expect(state.isDragging).toBe(false);
      expect(state.zoom).toBe(1);
      expect(state.initialized).toBe(false);
    });
  });

  describe('initDocument', () => {
    it('should set document and mark as initialized', () => {
      const doc = createDocument('Test Doc');
      useEditorStore.getState().initDocument(doc);

      const state = useEditorStore.getState();
      expect(state.document).toBeDefined();
      expect(state.document!.name).toBe('Test Doc');
      expect(state.initialized).toBe(true);
      expect(state.zoom).toBe(1);
      expect(state.selection.selectedIds).toEqual([]);
    });
  });

  // ---- 节点操作 ----

  describe('addNode', () => {
    it('should add a node to a container', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const textNode = createTextBlock('Hello', { id: 'text-1', name: 'Greeting' });
      useEditorStore.getState().addNode(doc.rootId, textNode);

      const state = useEditorStore.getState();
      expect(state.document!.nodes['text-1']).toBeDefined();
      expect(state.document!.nodes['text-1'].name).toBe('Greeting');

      const root = state.document!.nodes[doc.rootId];
      expect(root.type).toBe(BlockType.Container);
      expect((root as any).props.children).toContain('text-1');
    });

    it('should not add node if document is not initialized', () => {
      const textNode = createTextBlock('Hello', { id: 'text-1' });
      useEditorStore.getState().addNode('nonexistent', textNode);

      const state = useEditorStore.getState();
      expect(state.document).toBeNull();
    });

    it('should not add node if parent is not a container', () => {
      const doc = createDocument('Test');
      const textNode = createTextBlock('Hello', { id: 'text-1' });
      useEditorStore.getState().initDocument(doc);
      useEditorStore.getState().addNode(doc.rootId, textNode);

      const anotherText = createTextBlock('World', { id: 'text-2' });
      // text-1 is not a container, so this should be a no-op
      useEditorStore.getState().addNode('text-1', anotherText);

      const state = useEditorStore.getState();
      expect(state.document!.nodes['text-2']).toBeUndefined();
    });
  });

  describe('removeNode', () => {
    it('should remove a node from the document', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const textNode = createTextBlock('Hello', { id: 'text-1' });
      useEditorStore.getState().addNode(doc.rootId, textNode);
      useEditorStore.getState().removeNode('text-1');

      const state = useEditorStore.getState();
      expect(state.document!.nodes['text-1']).toBeUndefined();
      const root = state.document!.nodes[doc.rootId];
      expect((root as any).props.children).not.toContain('text-1');
    });

    it('should remove all descendant nodes when removing a container', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const container = createContainerBlock([], { id: 'container-1' });
      const child = createContainerBlock([], { id: 'child-1' });
      const grandchild = createTextBlock('Grandchild', { id: 'grandchild-1' });

      useEditorStore.getState().addNode(doc.rootId, container);
      useEditorStore.getState().addNode('container-1', child);
      useEditorStore.getState().addNode('child-1', grandchild);

      // Verify all nodes exist
      const stateBefore = useEditorStore.getState();
      expect(stateBefore.document!.nodes['container-1']).toBeDefined();
      expect(stateBefore.document!.nodes['child-1']).toBeDefined();
      expect(stateBefore.document!.nodes['grandchild-1']).toBeDefined();

      // Remove container - should cascade
      useEditorStore.getState().removeNode('container-1');

      const stateAfter = useEditorStore.getState();
      expect(stateAfter.document!.nodes['container-1']).toBeUndefined();
      expect(stateAfter.document!.nodes['child-1']).toBeUndefined();
      expect(stateAfter.document!.nodes['grandchild-1']).toBeUndefined();
    });

    it('should not remove root node', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      useEditorStore.getState().removeNode(doc.rootId);

      const state = useEditorStore.getState();
      expect(state.document!.nodes[doc.rootId]).toBeDefined();
    });

    it('should clear selection for removed nodes', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const textNode = createTextBlock('Hello', { id: 'text-1' });
      useEditorStore.getState().addNode(doc.rootId, textNode);
      useEditorStore.getState().selectNode('text-1');

      expect(useEditorStore.getState().selection.selectedIds).toEqual(['text-1']);

      useEditorStore.getState().removeNode('text-1');
      expect(useEditorStore.getState().selection.selectedIds).toEqual([]);
    });
  });

  describe('updateNodeStyle', () => {
    it('should update node style properties', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const textNode = createTextBlock('Hello', { id: 'text-1' });
      useEditorStore.getState().addNode(doc.rootId, textNode);

      useEditorStore.getState().updateNodeStyle('text-1', {
        backgroundColor: '#ff0000',
        fontSize: '16px',
      });

      const node = useEditorStore.getState().document!.nodes['text-1'];
      expect(node.style.backgroundColor).toBe('#ff0000');
      expect(node.style.fontSize).toBe('16px');
    });

    it('should merge style with existing style', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const textNode = createTextBlock('Hello', {
        id: 'text-1',
        style: { color: '#000', fontSize: '14px' },
      });
      useEditorStore.getState().addNode(doc.rootId, textNode);

      useEditorStore.getState().updateNodeStyle('text-1', { color: '#fff' });

      const node = useEditorStore.getState().document!.nodes['text-1'];
      expect(node.style.color).toBe('#fff');
      expect(node.style.fontSize).toBe('14px');
    });
  });

  describe('updateNodeLayout', () => {
    it('should update node layout properties', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const container = createContainerBlock([], { id: 'container-1' });
      useEditorStore.getState().addNode(doc.rootId, container);

      useEditorStore.getState().updateNodeLayout('container-1', {
        flexDirection: 'column',
        gap: 16,
      });

      const node = useEditorStore.getState().document!.nodes['container-1'];
      expect(node.layout.flexDirection).toBe('column');
      expect(node.layout.gap).toBe(16);
    });
  });

  describe('updateNode', () => {
    it('should update node data', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const textNode = createTextBlock('Hello', { id: 'text-1', name: 'Old Name' });
      useEditorStore.getState().addNode(doc.rootId, textNode);

      useEditorStore.getState().updateNode('text-1', { name: 'New Name' });

      const node = useEditorStore.getState().document!.nodes['text-1'];
      expect(node.name).toBe('New Name');
    });
  });

  describe('moveNode', () => {
    it('should move a node to a new parent', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const containerA = createContainerBlock([], { id: 'container-a' });
      const containerB = createContainerBlock([], { id: 'container-b' });
      const textNode = createTextBlock('Hello', { id: 'text-1' });

      useEditorStore.getState().addNode(doc.rootId, containerA);
      useEditorStore.getState().addNode(doc.rootId, containerB);
      useEditorStore.getState().addNode('container-a', textNode);

      // Verify text is in container-a
      let state = useEditorStore.getState();
      expect((state.document!.nodes['container-a'] as any).props.children).toContain('text-1');
      expect((state.document!.nodes['container-b'] as any).props.children).not.toContain('text-1');

      // Move text to container-b
      useEditorStore.getState().moveNode('text-1', 'container-b');

      state = useEditorStore.getState();
      expect((state.document!.nodes['container-a'] as any).props.children).not.toContain('text-1');
      expect((state.document!.nodes['container-b'] as any).props.children).toContain('text-1');
    });

    it('should prevent circular reference (moving parent into child)', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const parent = createContainerBlock([], { id: 'parent-1' });
      const child = createContainerBlock([], { id: 'child-1' });

      useEditorStore.getState().addNode(doc.rootId, parent);
      useEditorStore.getState().addNode('parent-1', child);

      // Try to move parent into child - should be prevented
      useEditorStore.getState().moveNode('parent-1', 'child-1');

      const state = useEditorStore.getState();
      // parent should still be a child of root
      expect((state.document!.nodes[doc.rootId] as any).props.children).toContain('parent-1');
      // child should still be a child of parent
      expect((state.document!.nodes['parent-1'] as any).props.children).toContain('child-1');
    });

    it('should not move root node', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const container = createContainerBlock([], { id: 'container-1' });
      useEditorStore.getState().addNode(doc.rootId, container);

      // Try to move root into container
      useEditorStore.getState().moveNode(doc.rootId, 'container-1');

      const state = useEditorStore.getState();
      // Root should still be root, container should still be child of root
      expect(state.document!.rootId).toBe(doc.rootId);
      expect((state.document!.nodes[doc.rootId] as any).props.children).toContain('container-1');
    });

    it('should move node to specific index', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const container = createContainerBlock([], { id: 'container-1' });
      const textA = createTextBlock('A', { id: 'text-a' });
      const textB = createTextBlock('B', { id: 'text-b' });
      const textC = createTextBlock('C', { id: 'text-c' });

      useEditorStore.getState().addNode(doc.rootId, container);
      useEditorStore.getState().addNode('container-1', textA);
      useEditorStore.getState().addNode('container-1', textB);
      useEditorStore.getState().addNode('container-1', textC);

      // Move C to index 0
      useEditorStore.getState().moveNode('text-c', 'container-1', 0);

      const state = useEditorStore.getState();
      const children = (state.document!.nodes['container-1'] as any).props.children;
      expect(children).toEqual(['text-c', 'text-a', 'text-b']);
    });
  });

  describe('selectNode', () => {
    it('should select a single node', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const textNode = createTextBlock('Hello', { id: 'text-1' });
      useEditorStore.getState().addNode(doc.rootId, textNode);

      useEditorStore.getState().selectNode('text-1');

      expect(useEditorStore.getState().selection.selectedIds).toEqual(['text-1']);
    });

    it('should replace selection in single-select mode', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const textA = createTextBlock('A', { id: 'text-a' });
      const textB = createTextBlock('B', { id: 'text-b' });
      useEditorStore.getState().addNode(doc.rootId, textA);
      useEditorStore.getState().addNode(doc.rootId, textB);

      useEditorStore.getState().selectNode('text-a');
      useEditorStore.getState().selectNode('text-b');

      expect(useEditorStore.getState().selection.selectedIds).toEqual(['text-b']);
    });

    it('should toggle selection in multi-select mode', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const textA = createTextBlock('A', { id: 'text-a' });
      const textB = createTextBlock('B', { id: 'text-b' });
      useEditorStore.getState().addNode(doc.rootId, textA);
      useEditorStore.getState().addNode(doc.rootId, textB);

      useEditorStore.getState().selectNode('text-a');
      useEditorStore.getState().selectNode('text-b', true);

      expect(useEditorStore.getState().selection.selectedIds).toEqual(['text-a', 'text-b']);

      // Toggle text-a off
      useEditorStore.getState().selectNode('text-a', true);
      expect(useEditorStore.getState().selection.selectedIds).toEqual(['text-b']);
    });

    it('should not select nonexistent node', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      useEditorStore.getState().selectNode('nonexistent');
      expect(useEditorStore.getState().selection.selectedIds).toEqual([]);
    });
  });

  describe('clearSelection', () => {
    it('should clear all selected nodes', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const textA = createTextBlock('A', { id: 'text-a' });
      useEditorStore.getState().addNode(doc.rootId, textA);
      useEditorStore.getState().selectNode('text-a');

      expect(useEditorStore.getState().selection.selectedIds).toEqual(['text-a']);

      useEditorStore.getState().clearSelection();
      expect(useEditorStore.getState().selection.selectedIds).toEqual([]);
    });
  });

  describe('setZoom', () => {
    it('should set zoom level', () => {
      useEditorStore.getState().setZoom(2);
      expect(useEditorStore.getState().zoom).toBe(2);
    });

    it('should clamp zoom to minimum 0.1', () => {
      useEditorStore.getState().setZoom(0.01);
      expect(useEditorStore.getState().zoom).toBe(0.1);
    });

    it('should clamp zoom to maximum 5', () => {
      useEditorStore.getState().setZoom(100);
      expect(useEditorStore.getState().zoom).toBe(5);
    });

    it('should allow boundary values 0.1 and 5', () => {
      useEditorStore.getState().setZoom(0.1);
      expect(useEditorStore.getState().zoom).toBe(0.1);

      useEditorStore.getState().setZoom(5);
      expect(useEditorStore.getState().zoom).toBe(5);
    });
  });

  describe('getNode', () => {
    it('should return node by id', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const textNode = createTextBlock('Hello', { id: 'text-1', name: 'My Text' });
      useEditorStore.getState().addNode(doc.rootId, textNode);

      const node = useEditorStore.getState().getNode('text-1');
      expect(node).toBeDefined();
      expect(node!.name).toBe('My Text');
    });

    it('should return undefined for nonexistent node', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const node = useEditorStore.getState().getNode('nonexistent');
      expect(node).toBeUndefined();
    });
  });

  describe('getDocumentSnapshot', () => {
    it('should return the current document', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const snapshot = useEditorStore.getState().getDocumentSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot!.name).toBe('Test');
    });

    it('should return null when no document is set', () => {
      const snapshot = useEditorStore.getState().getDocumentSnapshot();
      expect(snapshot).toBeNull();
    });
  });
});
