import { describe, it, expect, beforeEach } from 'vitest';
import { DiagnoseEngine } from '../diagnose/diagnose-engine';
import { useEditorStore } from '../store/editor-store';
import {
  createDocument,
  createContainerBlock,
  createTextBlock,
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

describe('DiagnoseEngine', () => {
  beforeEach(() => {
    useEditorStore.setState({
      document: null,
      selection: { selectedIds: [], hoveredId: null },
      isDragging: false,
      zoom: 1,
      initialized: false,
    });
  });

  function createEngine(): DiagnoseEngine {
    return new DiagnoseEngine(() => createFakeHook());
  }

  describe('diagnose', () => {
    it('should return a DiagnosticReport with issues array and summary', () => {
      const doc = createDocument('Test');
      useEditorStore.getState().initDocument(doc);

      const engine = createEngine();
      const report = engine.diagnose();

      expect(report).toHaveProperty('issues');
      expect(Array.isArray(report.issues)).toBe(true);
      expect(report).toHaveProperty('summary');
      expect(typeof report.summary).toBe('string');
    });

    it('should return no issues for a clean document', () => {
      const doc = createDocument('Clean');
      const textNode = createTextBlock('Hello');
      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [textNode.id];
      }
      doc.nodes = { ...doc.nodes, [textNode.id]: textNode };
      useEditorStore.getState().initDocument(doc);

      const engine = createEngine();
      const report = engine.diagnose();

      expect(report.summary).toBe('未检测到布局问题。');
    });
  });

  describe('empty container detection', () => {
    it('should detect empty containers', () => {
      const doc = createDocument('Test');
      const emptyContainer = createContainerBlock([], { name: 'Empty Box' });

      const rootNode = doc.nodes[doc.rootId];
      if (rootNode && rootNode.type === BlockType.Container) {
        rootNode.props.children = [emptyContainer.id];
      }
      doc.nodes = { ...doc.nodes, [emptyContainer.id]: emptyContainer };
      useEditorStore.getState().initDocument(doc);

      const engine = createEngine();
      const report = engine.diagnose();

      const emptyIssues = report.issues.filter(
        (i) => i.type === 'empty-container',
      );
      expect(emptyIssues.length).toBeGreaterThan(0);
      expect(emptyIssues[0].severity).toBe('warning');
      expect(emptyIssues[0].nodeIds).toContain(emptyContainer.id);
      expect(emptyIssues[0].suggestion).toBeTruthy();
    });
  });

  describe('deep nesting detection', () => {
    it('should detect deeply nested nodes (depth > 5)', () => {
      const doc = createDocument('Deep');

      // Create a chain of nested containers: root > c1 > c2 > c3 > c4 > c5 > c6
      let parentId = doc.rootId;
      const containerIds: string[] = [];

      for (let i = 0; i < 6; i++) {
        const container = createContainerBlock([], { name: `Level ${i}` });
        containerIds.push(container.id);
        doc.nodes = { ...doc.nodes, [container.id]: container };

        const parent = doc.nodes[parentId];
        if (parent && parent.type === BlockType.Container) {
          parent.props.children = [container.id];
        }
        parentId = container.id;
      }

      useEditorStore.getState().initDocument(doc);

      const engine = createEngine();
      const report = engine.diagnose();

      const deepIssues = report.issues.filter(
        (i) => i.type === 'deep-nesting',
      );
      expect(deepIssues.length).toBeGreaterThan(0);
      expect(deepIssues[0].severity).toBe('warning');
    });
  });
});
