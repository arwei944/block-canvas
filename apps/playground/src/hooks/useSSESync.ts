import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@block-canvas/core';
import type { BlockDocument } from '@block-canvas/core';

export function useSSESync(sseUrl: string = 'http://localhost:5175') {
  const connectedRef = useRef(false);

  const connect = useCallback(() => {
    if (connectedRef.current) return;

    const eventSource = new EventSource(`${sseUrl}/sse`);

    eventSource.onopen = () => {
      connectedRef.current = true;
      console.log('[SSE] Connected to MCP Server');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'init' || data.type === 'document') {
          if (data.document) {
            useEditorStore.getState().initDocument(data.document as BlockDocument);
          }
        }
        // selection and zoom are handled by the store subscription
      } catch (e) {
        console.error('[SSE] Parse error:', e);
      }
    };

    eventSource.onerror = () => {
      connectedRef.current = false;
      console.log('[SSE] Disconnected, reconnecting in 2s...');
      setTimeout(() => {
        eventSource.close();
        connect();
      }, 2000);
    };
  }, [sseUrl]);

  useEffect(() => {
    connect();
    return () => {
      connectedRef.current = false;
    };
  }, [connect]);
}
