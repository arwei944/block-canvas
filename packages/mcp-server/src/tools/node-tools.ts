import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { useEditorStore, createTextBlock, createImageBlock, createButtonBlock, createContainerBlock, cloneNode, BlockType } from '@block-canvas/core';
import type { BlockNode, BlockStyle, BlockLayout } from '@block-canvas/core';

function getStore() { return useEditorStore.getState(); }

export function registerNodeTools(server: McpServer) {

  // 1. add_node
  server.tool(
    'add_node',
    'Add a new node to the canvas. Supports types: text, image, button, container.',
    {
      type: z.enum(['text', 'image', 'button', 'container']).describe('Node type'),
      parentId: z.string().describe('Parent container ID to add the node into'),
      name: z.string().optional().describe('Display name for the node'),
      content: z.string().optional().describe('Text content (for text nodes) or label (for button nodes)'),
      src: z.string().optional().describe('Image URL (for image nodes)'),
      style: z.record(z.unknown()).optional().describe('CSS style properties (e.g., { fontSize: "16px", color: "#333" })'),
      layout: z.record(z.unknown()).optional().describe('Layout properties'),
    },
    async ({ type, parentId, name, content, src, style, layout }) => {
      const store = getStore();
      let node: BlockNode;

      switch (type) {
        case 'text':
          node = createTextBlock(content || 'New Text', {
            name: name || 'Text',
            style: style as Partial<BlockStyle>,
            layout: layout as Partial<BlockLayout>,
          });
          break;
        case 'image':
          node = createImageBlock(src || '', {
            name: name || 'Image',
            style: style as Partial<BlockStyle>,
            layout: layout as Partial<BlockLayout>,
          });
          break;
        case 'button':
          node = createButtonBlock(content || 'Button', {
            name: name || 'Button',
            style: style as Partial<BlockStyle>,
            layout: layout as Partial<BlockLayout>,
          });
          break;
        case 'container':
          node = createContainerBlock([], {
            name: name || 'Container',
            style: style as Partial<BlockStyle>,
            layout: layout as Partial<BlockLayout>,
          });
          break;
        default:
          return { content: [{ type: 'text' as const, text: `Unknown node type: ${type}` }], isError: true };
      }

      store.addNode(parentId, node);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ success: true, nodeId: node.id, type: node.type, name: node.name }, null, 2),
        }],
      };
    }
  );

  // 2. get_node
  server.tool(
    'get_node',
    'Get details of a specific node by ID.',
    { nodeId: z.string().describe('Node ID to retrieve') },
    async ({ nodeId }) => {
      const store = getStore();
      const node = store.getNode(nodeId);
      if (!node) {
        return { content: [{ type: 'text' as const, text: `Node not found: ${nodeId}` }], isError: true };
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(node, null, 2) }] };
    }
  );

  // 3. update_node_data
  server.tool(
    'update_node_data',
    'Update a node data/content (e.g., text content, image src, button label).',
    {
      nodeId: z.string().describe('Node ID'),
      data: z.record(z.unknown()).describe('Data updates (e.g., { content: "New text" })'),
    },
    async ({ nodeId, data }) => {
      const store = getStore();
      const node = store.getNode(nodeId);
      if (!node) {
        return { content: [{ type: 'text' as const, text: `Node not found: ${nodeId}` }], isError: true };
      }
      store.updateNode(nodeId, { data: { ...node.data, ...data } });
      return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, nodeId }) }] };
    }
  );

  // 4. update_node_style
  server.tool(
    'update_node_style',
    'Update a node visual styles (colors, fonts, spacing, borders, etc.).',
    {
      nodeId: z.string().describe('Node ID'),
      style: z.record(z.unknown()).describe('Style properties to update'),
    },
    async ({ nodeId, style }) => {
      const store = getStore();
      const node = store.getNode(nodeId);
      if (!node) {
        return { content: [{ type: 'text' as const, text: `Node not found: ${nodeId}` }], isError: true };
      }
      store.updateNodeStyle(nodeId, style as Partial<BlockStyle>);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, nodeId }) }] };
    }
  );

  // 5. update_node_layout
  server.tool(
    'update_node_layout',
    'Update a node layout properties (position, flex, grid).',
    {
      nodeId: z.string().describe('Node ID'),
      layout: z.record(z.unknown()).describe('Layout properties to update'),
    },
    async ({ nodeId, layout }) => {
      const store = getStore();
      const node = store.getNode(nodeId);
      if (!node) {
        return { content: [{ type: 'text' as const, text: `Node not found: ${nodeId}` }], isError: true };
      }
      store.updateNodeLayout(nodeId, layout as Partial<BlockLayout>);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, nodeId }) }] };
    }
  );

  // 6. remove_node
  server.tool(
    'remove_node',
    'Remove a node and all its children from the canvas.',
    { nodeId: z.string().describe('Node ID to remove') },
    async ({ nodeId }) => {
      const store = getStore();
      const node = store.getNode(nodeId);
      if (!node) {
        return { content: [{ type: 'text' as const, text: `Node not found: ${nodeId}` }], isError: true };
      }
      store.removeNode(nodeId);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, removedNode: nodeId }) }] };
    }
  );

  // 7. move_node
  server.tool(
    'move_node',
    'Move a node to a different parent container.',
    {
      nodeId: z.string().describe('Node ID to move'),
      newParentId: z.string().describe('New parent container ID'),
      index: z.number().optional().describe('Insert index in the new parent (0-based)'),
    },
    async ({ nodeId, newParentId, index }) => {
      const store = getStore();
      store.moveNode(nodeId, newParentId, index);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, nodeId, newParentId }) }] };
    }
  );

  // 8. duplicate_node
  server.tool(
    'duplicate_node',
    'Duplicate a node (creates a copy in the same parent).',
    { nodeId: z.string().describe('Node ID to duplicate') },
    async ({ nodeId }) => {
      const store = getStore();
      const node = store.getNode(nodeId);
      if (!node) {
        return { content: [{ type: 'text' as const, text: `Node not found: ${nodeId}` }], isError: true };
      }
      const cloned = cloneNode(node);
      // Find parent by checking all containers
      const doc = store.document;
      if (!doc) {
        return { content: [{ type: 'text' as const, text: 'No document loaded' }], isError: true };
      }
      let parentId = doc.rootId;
      for (const n of Object.values(doc.nodes) as BlockNode[]) {
        if (n.type === BlockType.Container) {
          const children = (n.props as any).children as string[] || [];
          if (children.includes(nodeId)) {
            parentId = n.id;
            break;
          }
        }
      }
      store.addNode(parentId, cloned);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, newNodeId: cloned.id, originalId: nodeId }) }] };
    }
  );

  // 9. query_nodes
  server.tool(
    'query_nodes',
    'Query nodes on the canvas with optional filters.',
    {
      type: z.enum(['text', 'image', 'button', 'container']).optional().describe('Filter by node type'),
      parentId: z.string().optional().describe('Filter by parent container ID'),
    },
    async ({ type, parentId }) => {
      const store = getStore();
      const doc = store.document;
      if (!doc) {
        return { content: [{ type: 'text' as const, text: 'No document loaded' }] };
      }
      let nodes = Object.values(doc.nodes) as BlockNode[];
      if (type) nodes = nodes.filter(n => n.type === type);
      if (parentId) {
        const parent = doc.nodes[parentId];
        if (parent && parent.type === 'container') {
          const childIds = (parent.props as any).children as string[] || [];
          nodes = nodes.filter(n => childIds.includes(n.id));
        }
      }
      const summary = nodes.map(n => ({ id: n.id, type: n.type, name: n.name }));
      return { content: [{ type: 'text' as const, text: JSON.stringify({ total: summary.length, nodes: summary }, null, 2) }] };
    }
  );
}
