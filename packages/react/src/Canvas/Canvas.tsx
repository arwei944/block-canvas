import React, { useCallback, useMemo } from 'react';
import { useEditor } from '../hooks/use-editor';
import { NodeElement } from '../NodeElement';

/**
 * Canvas - 画布组件
 * 从 store 获取 document 和 nodes，递归渲染节点树
 */
export const Canvas: React.FC = () => {
  const { document, zoom, clearSelection, selectNode } = useEditor();

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // 点击画布空白区域（事件目标是画布本身）时清除选中
      if (e.target === e.currentTarget) {
        clearSelection();
      }
    },
    [clearSelection],
  );

  const containerStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      overflow: 'auto',
      backgroundColor: 'transparent',
      position: 'relative' as const,
      cursor: 'default',
    }),
    [],
  );

  const innerStyle = useMemo<React.CSSProperties>(
    () => ({
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
      minWidth: '100%',
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
    }),
    [zoom],
  );

  if (!document) {
    return (
      <div style={containerStyle}>
        <div style={{ padding: 40, color: '#71717a', textAlign: 'center' }}>
          未加载文档
        </div>
      </div>
    );
  }

  const rootNode = document.nodes[document.rootId];

  return (
    <div style={containerStyle} onClick={handleCanvasClick}>
      <div style={innerStyle}>
        {rootNode && <NodeElement nodeId={rootNode.id} />}
      </div>
    </div>
  );
};
