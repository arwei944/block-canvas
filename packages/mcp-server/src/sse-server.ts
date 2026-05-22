import http from 'node:http';
import { useEditorStore } from '@block-canvas/core';

export class SSEServer {
  private server: http.Server | null = null;
  private clients: Set<http.ServerResponse> = new Set();
  private storeUnsubscribe: (() => void) | null = null;

  start(port: number = 5175): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        if (req.method === 'GET' && req.url === '/sse') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });
          this.clients.add(res);
          // Send initial state
          const state = useEditorStore.getState();
          res.write(`data: ${JSON.stringify({ type: 'init', document: state.document })}\n\n`);

          req.on('close', () => {
            this.clients.delete(res);
          });
          return;
        }

        if (req.method === 'GET' && req.url === '/state') {
          // REST endpoint for initial state
          const state = useEditorStore.getState();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(state.document));
          return;
        }

        res.writeHead(404);
        res.end('Not Found');
      });

      this.server.listen(port, () => {
        console.error(`SSE Server listening on port ${port}`);
        resolve();
      });

      // Subscribe to store changes
      this.storeUnsubscribe = useEditorStore.subscribe((state, prevState) => {
        if (state.document !== prevState.document) {
          this.broadcast({ type: 'document', document: state.document });
        }
        if (state.selection !== prevState.selection) {
          this.broadcast({ type: 'selection', selection: state.selection });
        }
        if (state.zoom !== prevState.zoom) {
          this.broadcast({ type: 'zoom', zoom: state.zoom });
        }
      });
    });
  }

  private broadcast(data: unknown) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(message);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  stop() {
    if (this.storeUnsubscribe) this.storeUnsubscribe();
    for (const client of this.clients) {
      client.destroy();
    }
    this.clients.clear();
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
