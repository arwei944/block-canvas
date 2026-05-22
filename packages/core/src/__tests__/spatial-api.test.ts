import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { SpatialAPI } from '../spatial/spatial-api';
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

describe('SpatialAPI', () => {
  let api: SpatialAPI;
  let doc: ReturnType<typeof createDocument>;

  beforeEach(() => {
    useEditorStore.setState({
      document: null,
      selection: { selectedIds: [], hoveredId: null },
      isDragging: false,
      zoom: 1,
      initialized: false,
    });
    api = new SpatialAPI(() => createFakeHook());
    doc = createDocument('Spatial Test');
    useEditorStore.getState().initDocument(doc);
  });

  // ---- 布局设置 ----

  describe('setLayout', () => {
    it('should set flex layout with direction', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      api.setLayout('c1', { mode: 'flex', direction: 'row' });

      const node = useEditorStore.getState().document!.nodes['c1'];
      expect(node.style.display).toBe('flex');
      expect(node.style.flexDirection).toBe('row');
      expect(node.layout.flexDirection).toBe('row');
    });

    it('should set flex layout with alignItems and justifyContent', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      api.setLayout('c1', {
        mode: 'flex',
        direction: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
      });

      const node = useEditorStore.getState().document!.nodes['c1'];
      expect(node.style.display).toBe('flex');
      expect(node.style.flexDirection).toBe('column');
      expect(node.style.alignItems).toBe('center');
      expect(node.style.justifyContent).toBe('space-between');
      expect(node.layout.alignItems).toBe('center');
    });

    it('should set grid layout', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      api.setLayout('c1', { mode: 'grid' });

      const node = useEditorStore.getState().document!.nodes['c1'];
      expect(node.style.display).toBe('grid');
    });

    it('should set gap', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      api.setLayout('c1', { mode: 'flex', gap: 24 });

      const node = useEditorStore.getState().document!.nodes['c1'];
      expect(node.style.gap).toBe(24);
      expect(node.layout.gap).toBe(24);
    });

    it('should set padding', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      api.setLayout('c1', { mode: 'flex', padding: 16 });

      const node = useEditorStore.getState().document!.nodes['c1'];
      expect(node.style.padding).toBe('16px');
    });

    it('should set padding as string', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      api.setLayout('c1', { mode: 'flex', padding: '20px 40px' });

      const node = useEditorStore.getState().document!.nodes['c1'];
      expect(node.style.padding).toBe('20px 40px');
    });

    it('should do nothing for nonexistent node', () => {
      expect(() => api.setLayout('nonexistent', { mode: 'flex' })).not.toThrow();
    });
  });

  // ---- 布局预设 ----

  describe('applyPreset', () => {
    const presetNames = [
      'sidebar-content',
      'center-stack',
      'holy-grail',
      'dashboard-grid',
      'header-content-footer',
      'two-columns',
      'three-columns',
    ];

    for (const preset of presetNames) {
      it(`should apply "${preset}" preset`, () => {
        const container = createContainerBlock([], { id: 'c1' });
        const rootNode = doc.nodes[doc.rootId];
        if (rootNode && rootNode.type === BlockType.Container) {
          rootNode.props.children = [container.id];
        }
        doc.nodes = { ...doc.nodes, [container.id]: container };
        useEditorStore.getState().initDocument(doc);

        api.applyPreset('c1', preset);

        const node = useEditorStore.getState().document!.nodes['c1'];
        expect(['flex', 'grid']).toContain(node.style.display);
      });
    }

    it('should throw for unknown preset', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      expect(() => api.applyPreset('c1', 'unknown-preset')).toThrow(
        '未知的布局预设',
      );
    });

    it('sidebar-content should set gridTemplateColumns', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      api.applyPreset('c1', 'sidebar-content');

      const node = useEditorStore.getState().document!.nodes['c1'];
      expect(node.style.display).toBe('grid');
      expect((node.style as any).gridTemplateColumns).toBe('240px 1fr');
    });

    it('center-stack should set flex centering', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      api.applyPreset('c1', 'center-stack');

      const node = useEditorStore.getState().document!.nodes['c1'];
      expect(node.style.display).toBe('flex');
      expect(node.style.flexDirection).toBe('column');
      expect(node.style.alignItems).toBe('center');
      expect(node.style.justifyContent).toBe('center');
    });

    it('two-columns should set equal columns', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      api.applyPreset('c1', 'two-columns');

      const node = useEditorStore.getState().document!.nodes['c1'];
      expect((node.style as any).gridTemplateColumns).toBe('1fr 1fr');
    });

    it('three-columns should set three equal columns', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      api.applyPreset('c1', 'three-columns');

      const node = useEditorStore.getState().document!.nodes['c1'];
      expect((node.style as any).gridTemplateColumns).toBe('1fr 1fr 1fr');
    });
  });

  // ---- 对齐 ----

  describe('align', () => {
    it('should align nodes horizontally relative to container', () => {
      const container = createContainerBlock([], {
        id: 'c1',
        style: { width: '800px' },
      });
      const nodeA = createTextBlock('A', {
        id: 'a',
        style: { width: '100px', height: '50px' },
      });
      const nodeB = createTextBlock('B', {
        id: 'b',
        style: { width: '100px', height: '50px' },
      });

      container.props.children = [nodeA.id, nodeB.id];
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [container.id]: container,
        [nodeA.id]: nodeA,
        [nodeB.id]: nodeB,
      };
      useEditorStore.getState().initDocument(doc);

      api.align(['a', 'b'], { axis: 'horizontal', align: 'center' });

      const nodeAAfter = useEditorStore.getState().document!.nodes['a'];
      const nodeBAfter = useEditorStore.getState().document!.nodes['b'];
      expect(nodeAAfter.style.left).toBe(350);
      expect(nodeBAfter.style.left).toBe(350);
    });

    it('should align nodes vertically relative to container', () => {
      const container = createContainerBlock([], {
        id: 'c1',
        style: { height: '600px' },
      });
      const nodeA = createTextBlock('A', {
        id: 'a',
        style: { width: '100px', height: '50px' },
      });
      const nodeB = createTextBlock('B', {
        id: 'b',
        style: { width: '100px', height: '50px' },
      });

      container.props.children = [nodeA.id, nodeB.id];
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [container.id]: container,
        [nodeA.id]: nodeA,
        [nodeB.id]: nodeB,
      };
      useEditorStore.getState().initDocument(doc);

      api.align(['a', 'b'], { axis: 'vertical', align: 'center' });

      const nodeAAfter = useEditorStore.getState().document!.nodes['a'];
      const nodeBAfter = useEditorStore.getState().document!.nodes['b'];
      expect(nodeAAfter.style.top).toBe(275);
      expect(nodeBAfter.style.top).toBe(275);
    });

    it('should do nothing with fewer than 2 nodes', () => {
      expect(() => api.align(['a'], { axis: 'horizontal', align: 'center' })).not.toThrow();
    });
  });

  // ---- 等间距分布 ----

  describe('distribute', () => {
    it('should distribute nodes horizontally with equal spacing', () => {
      const nodeA = createTextBlock('A', {
        id: 'a',
        style: { width: '100px', height: '50px', left: 0, top: 0 },
      });
      const nodeB = createTextBlock('B', {
        id: 'b',
        style: { width: '100px', height: '50px', left: 200, top: 0 },
      });
      const nodeC = createTextBlock('C', {
        id: 'c',
        style: { width: '100px', height: '50px', left: 400, top: 0 },
      });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [nodeA.id, nodeB.id, nodeC.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [nodeA.id]: nodeA,
        [nodeB.id]: nodeB,
        [nodeC.id]: nodeC,
      };
      useEditorStore.getState().initDocument(doc);

      api.distribute(['a', 'b', 'c'], { axis: 'horizontal' });

      const state = useEditorStore.getState();
      const a = state.document!.nodes['a'];
      const b = state.document!.nodes['b'];
      const c = state.document!.nodes['c'];

      expect(a.style.left).toBe(0);
      expect(b.style.left).toBe(200);
      expect(c.style.left).toBe(400);
    });

    it('should do nothing with fewer than 3 nodes', () => {
      expect(() => api.distribute(['a', 'b'], { axis: 'horizontal' })).not.toThrow();
    });
  });

  // ---- 居中 ----

  describe('center', () => {
    it('should center node horizontally in container', () => {
      const container = createContainerBlock([], {
        id: 'c1',
        style: { width: '800px', height: '600px' },
      });
      const node = createTextBlock('Center Me', {
        id: 'n1',
        style: { width: '200px', height: '100px' },
      });

      container.props.children = [node.id];
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [container.id]: container,
        [node.id]: node,
      };
      useEditorStore.getState().initDocument(doc);

      api.center('n1', { in: 'c1', axis: 'horizontal' });

      const centeredNode = useEditorStore.getState().document!.nodes['n1'];
      expect(centeredNode.style.left).toBe(300);
    });

    it('should center node vertically in container', () => {
      const container = createContainerBlock([], {
        id: 'c1',
        style: { width: '800px', height: '600px' },
      });
      const node = createTextBlock('Center Me', {
        id: 'n1',
        style: { width: '200px', height: '100px' },
      });

      container.props.children = [node.id];
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [container.id]: container,
        [node.id]: node,
      };
      useEditorStore.getState().initDocument(doc);

      api.center('n1', { in: 'c1', axis: 'vertical' });

      const centeredNode = useEditorStore.getState().document!.nodes['n1'];
      expect(centeredNode.style.top).toBe(250);
    });

    it('should center node on both axes', () => {
      const container = createContainerBlock([], {
        id: 'c1',
        style: { width: '800px', height: '600px' },
      });
      const node = createTextBlock('Center Me', {
        id: 'n1',
        style: { width: '200px', height: '100px' },
      });

      container.props.children = [node.id];
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = {
        ...doc.nodes,
        [container.id]: container,
        [node.id]: node,
      };
      useEditorStore.getState().initDocument(doc);

      api.center('n1', { in: 'c1', axis: 'both' });

      const centeredNode = useEditorStore.getState().document!.nodes['n1'];
      expect(centeredNode.style.left).toBe(300);
      expect(centeredNode.style.top).toBe(250);
    });
  });

  // ---- 间距 ----

  describe('setGap', () => {
    it('should set gap on a container', () => {
      const container = createContainerBlock([], { id: 'c1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [container.id];
      }
      doc.nodes = { ...doc.nodes, [container.id]: container };
      useEditorStore.getState().initDocument(doc);

      api.setGap('c1', 32);

      const node = useEditorStore.getState().document!.nodes['c1'];
      expect(node.style.gap).toBe(32);
      expect(node.layout.gap).toBe(32);
    });
  });

  // ---- 尺寸 ----

  describe('setSize', () => {
    it('should set width and height', () => {
      const node = createTextBlock('Size Me', { id: 'n1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [node.id];
      }
      doc.nodes = { ...doc.nodes, [node.id]: node };
      useEditorStore.getState().initDocument(doc);

      api.setSize('n1', { width: 300, height: 200 });

      const updatedNode = useEditorStore.getState().document!.nodes['n1'];
      expect(updatedNode.style.width).toBe('300px');
      expect(updatedNode.style.height).toBe('200px');
    });

    it('should set size with string values', () => {
      const node = createTextBlock('Size Me', { id: 'n1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [node.id];
      }
      doc.nodes = { ...doc.nodes, [node.id]: node };
      useEditorStore.getState().initDocument(doc);

      api.setSize('n1', { width: '100%', height: 'auto' });

      const updatedNode = useEditorStore.getState().document!.nodes['n1'];
      expect(updatedNode.style.width).toBe('100%');
      expect(updatedNode.style.height).toBe('auto');
    });

    it('should store min/max constraints in data', () => {
      const node = createTextBlock('Constrained', { id: 'n1' });
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [node.id];
      }
      doc.nodes = { ...doc.nodes, [node.id]: node };
      useEditorStore.getState().initDocument(doc);

      api.setSize('n1', {
        minWidth: 100,
        maxWidth: 500,
        minHeight: 50,
        maxHeight: 300,
      });

      const updatedNode = useEditorStore.getState().document!.nodes['n1'];
      expect(updatedNode.data).toBeDefined();
      expect((updatedNode.data as any).sizeConstraints.minWidth).toBe('100px');
      expect((updatedNode.data as any).sizeConstraints.maxWidth).toBe('500px');
      expect((updatedNode.data as any).sizeConstraints.minHeight).toBe('50px');
      expect((updatedNode.data as any).sizeConstraints.maxHeight).toBe('300px');
    });
  });
});
