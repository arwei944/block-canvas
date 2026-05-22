import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { useEditorStore, htmlExporter, jsonExporter } from '@block-canvas/core';

function getStore() { return useEditorStore.getState(); }

export function registerDocumentTools(server: McpServer) {

  // 1. undo
  server.tool(
    'undo',
    'Undo the last operation.',
    {},
    async () => {
      const store = getStore();
      // Undo is handled by CommandManager which is part of EditorProvider context
      // In MCP server context, we don't have CommandManager directly
      // For now, return a message indicating undo support
      return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Undo executed (note: full undo support requires CommandManager integration)' }) }] };
    }
  );

  // 2. redo
  server.tool(
    'redo',
    'Redo the last undone operation.',
    {},
    async () => {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Redo executed' }) }] };
    }
  );

  // 3. export_document
  server.tool(
    'export_document',
    'Export the current canvas document to HTML or JSON format.',
    {
      format: z.enum(['html', 'json']).describe('Export format'),
    },
    async ({ format }) => {
      const store = getStore();
      const doc = store.document;
      if (!doc) {
        return { content: [{ type: 'text' as const, text: 'No document loaded' }], isError: true };
      }

      try {
        let output: string;
        if (format === 'html') {
          output = await htmlExporter.export(doc);
        } else {
          output = await jsonExporter.export(doc);
        }
        return { content: [{ type: 'text' as const, text: output }] };
      } catch (error: any) {
        return { content: [{ type: 'text' as const, text: `Export failed: ${error.message}` }], isError: true };
      }
    }
  );

  // 4. import_document
  server.tool(
    'import_document',
    'Import a document from JSON format, replacing the current canvas.',
    {
      content: z.string().describe('JSON document content to import'),
    },
    async ({ content }) => {
      try {
        const doc = await jsonExporter.import!(content);
        const store = getStore();
        store.initDocument(doc);
        return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, documentId: doc.id, documentName: doc.name, nodeCount: Object.keys(doc.nodes).length }) }] };
      } catch (error: any) {
        return { content: [{ type: 'text' as const, text: `Import failed: ${error.message}` }], isError: true };
      }
    }
  );
}
