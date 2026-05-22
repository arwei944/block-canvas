import { describe, it, expect, beforeEach } from 'vitest';
import { htmlExporter } from '../exporters/html-exporter';
import { jsonExporter } from '../exporters/json-exporter';
import {
  createDocument,
  createTextBlock,
  createButtonBlock,
  createImageBlock,
  createContainerBlock,
} from '../node';
import { BlockType } from '../types';

describe('HTML Exporter', () => {
  it('should export text node as div with content', async () => {
    const doc = createDocument('Text Doc');
    const textNode = createTextBlock('Hello World', {
      id: 'text-1',
      name: 'My Text',
      style: { fontSize: '16px', color: '#333' },
    });
    doc.nodes['text-1'] = textNode;
    (doc.nodes[doc.rootId] as any).props.children.push('text-1');

    const html = await htmlExporter.export(doc);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Hello World');
    expect(html).toContain('class="text"');
    expect(html).toContain('id="block-text-1"');
    expect(html).toContain('font-size: 16px');
    expect(html).toContain('color: #333');
  });

  it('should export image node as img tag', async () => {
    const doc = createDocument('Image Doc');
    const imgNode = createImageBlock('photo.jpg', {
      id: 'img-1',
      name: 'My Image',
      style: { width: '200px' },
      props: { src: 'photo.jpg', alt: 'A photo' },
    });
    doc.nodes['img-1'] = imgNode;
    (doc.nodes[doc.rootId] as any).props.children.push('img-1');

    const html = await htmlExporter.export(doc);

    expect(html).toContain('<img');
    expect(html).toContain('src="photo.jpg"');
    expect(html).toContain('alt="A photo"');
    expect(html).toContain('class="image"');
  });

  it('should export button node as button tag', async () => {
    const doc = createDocument('Button Doc');
    const btnNode = createButtonBlock('Click Me', {
      id: 'btn-1',
      name: 'My Button',
      style: { backgroundColor: '#007bff' },
    });
    doc.nodes['btn-1'] = btnNode;
    (doc.nodes[doc.rootId] as any).props.children.push('btn-1');

    const html = await htmlExporter.export(doc);

    expect(html).toContain('<button');
    expect(html).toContain('Click Me');
    expect(html).toContain('class="button"');
    expect(html).toContain('background-color: #007bff');
  });

  it('should export button with href as anchor tag', async () => {
    const doc = createDocument('Link Doc');
    const linkNode = createButtonBlock('Go to page', {
      id: 'link-1',
      name: 'My Link',
      props: { label: 'Go to page', href: 'https://example.com' },
    });
    doc.nodes['link-1'] = linkNode;
    (doc.nodes[doc.rootId] as any).props.children.push('link-1');

    const html = await htmlExporter.export(doc);

    expect(html).toContain('<a');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('Go to page');
  });

  it('should export container with nested children', async () => {
    const doc = createDocument('Container Doc');
    const container = createContainerBlock([], {
      id: 'c1',
      name: 'Wrapper',
      style: { padding: '16px' },
    });
    const textNode = createTextBlock('Inside', { id: 't1', name: 'Inner Text' });

    doc.nodes['c1'] = container;
    doc.nodes['t1'] = textNode;
    (doc.nodes[doc.rootId] as any).props.children.push('c1');
    (doc.nodes['c1'] as any).props.children.push('t1');

    const html = await htmlExporter.export(doc);

    expect(html).toContain('class="container"');
    expect(html).toContain('padding: 16px');
    expect(html).toContain('Inside');
  });

  it('should generate valid HTML document structure', async () => {
    const doc = createDocument('Full Doc');
    const html = await htmlExporter.export(doc);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<head>');
    expect(html).toContain('<meta charset="UTF-8"');
    expect(html).toContain('<meta name="viewport"');
    expect(html).toContain(`<title>${doc.name}</title>`);
    expect(html).toContain('<style>');
    expect(html).toContain('</style>');
    expect(html).toContain('</head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</body>');
    expect(html).toContain('</html>');
  });

  it('should include CSS reset styles', async () => {
    const doc = createDocument('CSS Doc');
    const html = await htmlExporter.export(doc);

    expect(html).toContain('box-sizing: border-box');
    expect(html).toContain('margin: 0');
    expect(html).toContain('padding: 0');
  });

  it('should escape HTML special characters in text content', async () => {
    const doc = createDocument('Escape Doc');
    const textNode = createTextBlock('<script>alert("xss")</script>', {
      id: 't1',
      name: 'XSS Test',
    });
    doc.nodes['t1'] = textNode;
    (doc.nodes[doc.rootId] as any).props.children.push('t1');

    const html = await htmlExporter.export(doc);

    expect(html).not.toContain('<script>alert("xss")</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should include layout properties in CSS', async () => {
    const doc = createDocument('Layout Doc');
    const container = createContainerBlock([], {
      id: 'c1',
      style: { display: 'flex', flexDirection: 'row', gap: 16 },
      layout: { flexDirection: 'row', gap: 16 },
    });
    doc.nodes['c1'] = container;
    (doc.nodes[doc.rootId] as any).props.children.push('c1');

    const html = await htmlExporter.export(doc);

    expect(html).toContain('display: flex');
    expect(html).toContain('flex-direction: row');
    expect(html).toContain('gap: 16px');
  });
});

describe('JSON Exporter', () => {
  it('should export document as formatted JSON', async () => {
    const doc = createDocument('JSON Doc');
    const textNode = createTextBlock('Hello', { id: 't1', name: 'Greeting' });
    doc.nodes['t1'] = textNode;
    (doc.nodes[doc.rootId] as any).props.children.push('t1');

    const json = await jsonExporter.export(doc);
    const parsed = JSON.parse(json);

    expect(parsed.id).toBe(doc.id);
    expect(parsed.name).toBe('JSON Doc');
    expect(parsed.rootId).toBe(doc.rootId);
    expect(parsed.nodes['t1']).toBeDefined();
    expect(parsed.nodes['t1'].type).toBe('text');
    expect(parsed.nodes['t1'].props.content).toBe('Hello');
  });

  it('should produce valid JSON (round-trip)', async () => {
    const doc = createDocument('Round Trip');
    const container = createContainerBlock([], { id: 'c1', name: 'Box' });
    const textNode = createTextBlock('Content', { id: 't1', name: 'Text' });
    const btnNode = createButtonBlock('Submit', { id: 'b1', name: 'Button' });

    doc.nodes['c1'] = container;
    doc.nodes['t1'] = textNode;
    doc.nodes['b1'] = btnNode;
    (doc.nodes[doc.rootId] as any).props.children.push('c1');
    (doc.nodes['c1'] as any).props.children.push('t1');
    (doc.nodes['c1'] as any).props.children.push('b1');

    const json = await jsonExporter.export(doc);
    const imported = await jsonExporter.import!(json);

    expect(imported.id).toBe(doc.id);
    expect(imported.name).toBe('Round Trip');
    expect(imported.rootId).toBe(doc.rootId);
    expect(imported.nodes['c1']).toBeDefined();
    expect(imported.nodes['t1']).toBeDefined();
    expect(imported.nodes['b1']).toBeDefined();
    expect((imported.nodes['t1'].props as any).content).toBe('Content');
    expect((imported.nodes['b1'].props as any).label).toBe('Submit');
  });

  it('should reject invalid JSON (missing id)', async () => {
    const invalidDoc = { name: 'No ID', rootId: 'root', nodes: { root: {} } };

    await expect(jsonExporter.import!(JSON.stringify(invalidDoc))).rejects.toThrow(
      'missing or invalid "id" field',
    );
  });

  it('should reject invalid JSON (missing name)', async () => {
    const invalidDoc = { id: 'doc-1', rootId: 'root', nodes: { root: {} } };

    await expect(jsonExporter.import!(JSON.stringify(invalidDoc))).rejects.toThrow(
      'missing or invalid "name" field',
    );
  });

  it('should reject invalid JSON (missing rootId)', async () => {
    const invalidDoc = { id: 'doc-1', name: 'Test', nodes: { root: {} } };

    await expect(jsonExporter.import!(JSON.stringify(invalidDoc))).rejects.toThrow(
      'missing or invalid "rootId" field',
    );
  });

  it('should reject invalid JSON (missing nodes)', async () => {
    const invalidDoc = { id: 'doc-1', name: 'Test', rootId: 'root' };

    await expect(jsonExporter.import!(JSON.stringify(invalidDoc))).rejects.toThrow(
      'missing or invalid "nodes" field',
    );
  });

  it('should reject invalid JSON (root not in nodes)', async () => {
    const invalidDoc = {
      id: 'doc-1',
      name: 'Test',
      rootId: 'nonexistent-root',
      nodes: {},
    };

    await expect(jsonExporter.import!(JSON.stringify(invalidDoc))).rejects.toThrow(
      'root node not found in "nodes"',
    );
  });

  it('should reject malformed JSON', async () => {
    await expect(jsonExporter.import!('not json at all')).rejects.toThrow();
  });
});
