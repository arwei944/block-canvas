import { describe, it, expect } from 'vitest';
import {
  generateBlockId,
  createTextBlock,
  createImageBlock,
  createButtonBlock,
  createContainerBlock,
  createDocument,
  cloneNode,
  validateNode,
} from '../node';
import { BlockType } from '../types';

describe('generateBlockId', () => {
  it('should return a non-empty string', () => {
    const id = generateBlockId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should return unique ids', () => {
    const id1 = generateBlockId();
    const id2 = generateBlockId();
    expect(id1).not.toBe(id2);
  });
});

describe('createTextBlock', () => {
  it('should create a text node with correct type and content', () => {
    const node = createTextBlock('Hello');
    expect(node.type).toBe(BlockType.Text);
    expect(node.props.content).toBe('Hello');
    expect(node.name).toBe('Text Block');
    expect(node.id).toBeTruthy();
    expect(node.style).toBeDefined();
    expect(node.layout).toBeDefined();
  });

  it('should accept overrides', () => {
    const node = createTextBlock('World', {
      name: 'My Text',
      style: { fontSize: '20px', color: '#333' },
    });
    expect(node.name).toBe('My Text');
    expect(node.style.fontSize).toBe('20px');
    expect(node.style.color).toBe('#333');
    expect(node.props.content).toBe('World');
  });
});

describe('createImageBlock', () => {
  it('should create an image node with correct type and src', () => {
    const node = createImageBlock('https://example.com/img.png');
    expect(node.type).toBe(BlockType.Image);
    expect(node.props.src).toBe('https://example.com/img.png');
    expect(node.name).toBe('Image Block');
  });

  it('should accept overrides', () => {
    const node = createImageBlock('https://example.com/img.png', {
      name: 'My Image',
      style: { width: '100px' },
      props: { alt: 'test' },
    });
    expect(node.name).toBe('My Image');
    expect(node.style.width).toBe('100px');
    expect(node.props.alt).toBe('test');
  });
});

describe('createButtonBlock', () => {
  it('should create a button node with correct type and label', () => {
    const node = createButtonBlock('Click');
    expect(node.type).toBe(BlockType.Button);
    expect(node.props.label).toBe('Click');
    expect(node.name).toBe('Button Block');
  });

  it('should accept overrides', () => {
    const node = createButtonBlock('Submit', {
      name: 'Submit Button',
      props: { variant: 'primary' },
    });
    expect(node.name).toBe('Submit Button');
    expect(node.props.variant).toBe('primary');
  });
});

describe('createContainerBlock', () => {
  it('should create a container node with correct type and children', () => {
    const node = createContainerBlock(['id1', 'id2']);
    expect(node.type).toBe(BlockType.Container);
    expect(node.props.children).toEqual(['id1', 'id2']);
    expect(node.name).toBe('Container Block');
  });

  it('should default to empty children', () => {
    const node = createContainerBlock();
    expect(node.props.children).toEqual([]);
  });
});

describe('createDocument', () => {
  it('should create a document with a root container node', () => {
    const doc = createDocument('Test Doc');
    expect(doc.name).toBe('Test Doc');
    expect(doc.version).toBe(1);
    expect(doc.rootId).toBeTruthy();
    expect(doc.id).toBeTruthy();
    expect(doc.createdAt).toBeTruthy();
    expect(doc.updatedAt).toBeTruthy();
    expect(doc.nodes[doc.rootId]).toBeDefined();
    expect(doc.nodes[doc.rootId].type).toBe(BlockType.Container);
  });
});

describe('cloneNode', () => {
  it('should deep clone a text node with a new id', () => {
    const original = createTextBlock('Hello', {
      name: 'Original',
      style: { fontSize: '16px' },
    });
    const cloned = cloneNode(original);
    expect(cloned.id).not.toBe(original.id);
    expect(cloned.type).toBe(original.type);
    expect(cloned.name).toBe(original.name);
    expect(cloned.props.content).toBe(original.props.content);
    expect(cloned.style).toEqual(original.style);
    // Ensure style is a copy, not the same reference
    expect(cloned.style).not.toBe(original.style);
  });

  it('should deep clone a container node with children array copied', () => {
    const original = createContainerBlock(['child1', 'child2']);
    const cloned = cloneNode(original);
    expect(cloned.id).not.toBe(original.id);
    expect(cloned.props.children).toEqual(original.props.children);
    expect(cloned.props.children).not.toBe(original.props.children);
  });

  it('should deep clone an image node', () => {
    const original = createImageBlock('https://example.com/img.png', {
      props: { alt: 'test' },
    });
    const cloned = cloneNode(original);
    expect(cloned.id).not.toBe(original.id);
    expect(cloned.props.src).toBe(original.props.src);
    expect(cloned.props.alt).toBe(original.props.alt);
  });

  it('should deep clone a button node', () => {
    const original = createButtonBlock('Click', {
      props: { variant: 'primary' },
    });
    const cloned = cloneNode(original);
    expect(cloned.id).not.toBe(original.id);
    expect(cloned.props.label).toBe(original.props.label);
    expect(cloned.props.variant).toBe(original.props.variant);
  });
});

describe('validateNode', () => {
  it('should return true for a valid text node', () => {
    const node = createTextBlock('Hello');
    expect(validateNode(node)).toBe(true);
  });

  it('should return true for a valid image node', () => {
    const node = createImageBlock('https://example.com/img.png');
    expect(validateNode(node)).toBe(true);
  });

  it('should return true for a valid button node', () => {
    const node = createButtonBlock('Click');
    expect(validateNode(node)).toBe(true);
  });

  it('should return true for a valid container node', () => {
    const node = createContainerBlock([]);
    expect(validateNode(node)).toBe(true);
  });

  it('should return false for a node without id', () => {
    const node = createTextBlock('Hello');
    const invalid = { ...node, id: '' };
    expect(validateNode(invalid)).toBe(false);
  });

  it('should return false for a node without name', () => {
    const node = createTextBlock('Hello');
    const invalid = { ...node, name: '' };
    expect(validateNode(invalid)).toBe(false);
  });

  it('should return false for a node with invalid type', () => {
    const node = createTextBlock('Hello');
    const invalid = { ...node, type: 'unknown' };
    expect(validateNode(invalid)).toBe(false);
  });

  it('should return false for a text node without content', () => {
    const node = createTextBlock('Hello');
    const invalid = { ...node, props: { ...node.props, content: undefined } };
    expect(validateNode(invalid)).toBe(false);
  });

  it('should return false for an image node without src', () => {
    const node = createImageBlock('https://example.com/img.png');
    const invalid = { ...node, props: { ...node.props, src: undefined } };
    expect(validateNode(invalid)).toBe(false);
  });

  it('should return false for a button node without label', () => {
    const node = createButtonBlock('Click');
    const invalid = { ...node, props: { ...node.props, label: undefined } };
    expect(validateNode(invalid)).toBe(false);
  });

  it('should return false for a container node without children array', () => {
    const node = createContainerBlock([]);
    const invalid = { ...node, props: { children: null } };
    expect(validateNode(invalid)).toBe(false);
  });
});
