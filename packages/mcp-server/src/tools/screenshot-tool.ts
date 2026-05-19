import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerScreenshotTool(server: McpServer) {
  server.tool(
    'screenshot',
    'Capture the current canvas state as a JSON snapshot (visual screenshot requires a running Viewer). Returns the full document state for AI to understand the visual layout.',
    {
      detail: z.enum(['summary', 'full']).optional().default('summary').describe('Level of detail'),
    },
    async ({ detail }) => {
      // Since we can't run a browser in MCP server context,
      // return the structured document data that represents the visual state
      const { useEditorStore } = await import('@block-canvas/core');
      const doc = useEditorStore.getState().document;
      if (!doc) {
        return { content: [{ type: 'text' as const, text: 'No document loaded' }], isError: true };
      }

      // Build a visual description from the node tree
      const nodes = doc.nodes;
      const root = nodes[doc.rootId];

      function describeNode(nodeId: string, indent: number = 0): string {
        const node = nodes[nodeId];
        if (!node) return '';
        const prefix = '  '.repeat(indent);
        const style = node.style || {};
        const styleDesc = [
          style.width ? `w=${style.width}` : '',
          style.height ? `h=${style.height}` : '',
          style.backgroundColor ? `bg=${style.backgroundColor}` : '',
          style.fontSize ? `fs=${style.fontSize}` : '',
          style.color ? `c=${style.color}` : '',
          style.padding ? `p=${style.padding}` : '',
          style.borderRadius ? `br=${style.borderRadius}` : '',
        ].filter(Boolean).join(' ');

        let line = `${prefix}[${node.type}] "${node.name}"${styleDesc ? ` (${styleDesc})` : ''}`;

        if (node.type === 'container') {
          const children = (node.props as any).children || [];
          for (const childId of children) {
            line += '\n' + describeNode(childId, indent + 1);
          }
        }
        return line;
      }

      const visualTree = describeNode(doc.rootId);
      const summary = `Document: "${doc.name}" | Nodes: ${Object.keys(nodes).length}\n\n${visualTree}`;

      return {
        content: [{ type: 'text' as const, text: summary }],
      };
    }
  );
}
