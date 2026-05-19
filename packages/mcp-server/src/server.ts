import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Core imports
import { useEditorStore, createDocument, SnapshotEngine, DiagnoseEngine, SpatialAPI, pluginManager } from '@block-canvas/core';
import { BlockType } from '@block-canvas/core';
import type { BlockNode, BlockStyle, BlockLayout } from '@block-canvas/core';

// Tool imports
import { registerNodeTools } from './tools/node-tools.js';
import { registerDocumentTools } from './tools/document-tools.js';
import { registerCanvasResources } from './tools/canvas-resources.js';
import { registerLayoutTools } from './tools/layout-tools.js';
import { registerTransactionTool } from './tools/transaction-tools.js';
import { registerPrompts } from './prompts/index.js';

export class BlockCanvasMCPServer {
  private server: McpServer;
  private snapshotEngine: SnapshotEngine;
  private diagnoseEngine: DiagnoseEngine;
  private spatialAPI: SpatialAPI;

  constructor() {
    // Initialize store
    const store = useEditorStore.getState();

    // Create default document if not initialized
    if (!store.document) {
      const doc = createDocument('Untitled');
      store.initDocument(doc);
    }

    // Inject store into pluginManager
    pluginManager.setStore(useEditorStore);

    // Create engines
    this.snapshotEngine = new SnapshotEngine(store);
    this.diagnoseEngine = new DiagnoseEngine(() => useEditorStore);
    this.spatialAPI = new SpatialAPI(() => useEditorStore);

    // Create MCP Server
    this.server = new McpServer(
      {
        name: 'block-canvas',
        version: '3.0.0',
      },
      {
        instructions: `You are a visual frontend builder assistant. You can create and modify UI components on a canvas.

## Workflow
1. First, call get_canvas_snapshot to understand the current state
2. Use add_node to create components (text, image, button, container)
3. Use update_node_style to modify appearance (colors, fonts, spacing)
4. Use layout tools to arrange components (presets, align, distribute)
5. Use diagnose_layout to check for issues
6. Use export_document to generate final code

## Available Node Types
- text: Text content with font styling
- image: Image with src URL
- button: Clickable button (primary/secondary/ghost variants)
- container: Layout container (flex/grid) that holds other nodes

## Layout Presets
- sidebar-content: Sidebar + main content area
- center-stack: Vertically centered stack
- holy-grail: Classic 3-column layout
- dashboard-grid: Responsive grid dashboard
- header-content-footer: Page with header, content, footer
- two-columns: Equal two-column layout
- three-columns: Equal three-column layout

## Tips
- Always add nodes to a parent container (use the root ID from snapshot)
- Use apply_layout_preset for quick layouts
- Check diagnose_layout after major changes
- Use execute_transaction for batch operations`,
      }
    );

    // Register all tools
    registerNodeTools(this.server);
    registerDocumentTools(this.server);
    registerCanvasResources(this.server, this.snapshotEngine, this.diagnoseEngine);
    registerLayoutTools(this.server, this.spatialAPI);
    registerTransactionTool(this.server);
    registerPrompts(this.server);
  }

  async start(transport?: StdioServerTransport) {
    const t = transport || new StdioServerTransport();
    await this.server.connect(t);
    console.error('BlockCanvas MCP Server started');
  }

  // Expose engines for testing
  getSnapshotEngine() { return this.snapshotEngine; }
  getDiagnoseEngine() { return this.diagnoseEngine; }
  getSpatialAPI() { return this.spatialAPI; }
}

export function createBlockCanvasServer(): BlockCanvasMCPServer {
  return new BlockCanvasMCPServer();
}
