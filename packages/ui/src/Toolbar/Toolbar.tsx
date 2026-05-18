import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useEditor } from '@block-canvas/react';
import { BlockType } from '@block-canvas/core';
import type { BlockNode } from '@block-canvas/core';
import { toolbarStyles, buttonStyles, colors } from '../shared/styles';

const BLOCK_TYPE_ICONS: Record<string, string> = {
  [BlockType.Text]: 'T',
  [BlockType.Image]: '\u{1F5BC}',
  [BlockType.Button]: '\u25A3',
  [BlockType.Container]: '\u25A1',
};

const BLOCK_TYPE_LABELS: Record<string, string> = {
  [BlockType.Text]: '文本',
  [BlockType.Image]: '图片',
  [BlockType.Button]: '按钮',
  [BlockType.Container]: '容器',
};

function createDefaultNode(type: BlockType): BlockNode {
  const base = {
    id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    name: `${BLOCK_TYPE_LABELS[type] || type}`,
    style: {},
    layout: {},
    visible: true,
  };

  switch (type) {
    case BlockType.Text:
      return {
        ...base,
        props: { content: '新文本' },
      } as BlockNode;
    case BlockType.Image:
      return {
        ...base,
        props: { src: '', alt: '' },
      } as BlockNode;
    case BlockType.Button:
      return {
        ...base,
        props: { label: '按钮', variant: 'primary' },
      } as BlockNode;
    case BlockType.Container:
      return {
        ...base,
        props: { children: [] },
      } as BlockNode;
    default:
      return base as BlockNode;
  }
}

export interface ToolbarProps {
  style?: React.CSSProperties;
}

export const Toolbar: React.FC<ToolbarProps> = ({ style }) => {
  const {
    zoom,
    setZoom,
    undo,
    redo,
    canUndo,
    canRedo,
    document,
    addNode,
  } = useEditor();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'free' | 'flow'>('free');
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!showAddMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    window.document.addEventListener('mousedown', handleClickOutside);
    return () => window.document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMenu]);

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(5, zoom + 0.1));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(0.1, zoom - 0.1));
  }, [zoom, setZoom]);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  const handleAddNode = useCallback(
    (type: BlockType) => {
      if (!document) return;
      const node = createDefaultNode(type);
      addNode(document.rootId, node);
      setShowAddMenu(false);
    },
    [document, addNode],
  );

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div style={{ ...toolbarStyles.container, ...style }}>
      {/* 撤销 / 重做 */}
      <div style={toolbarStyles.group}>
        <button
          style={{
            ...(canUndo ? buttonStyles.ghost : buttonStyles.disabled),
            ...buttonStyles.icon,
          }}
          onClick={undo}
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
        >
          {'\u21A9'}
        </button>
        <button
          style={{
            ...(canRedo ? buttonStyles.ghost : buttonStyles.disabled),
            ...buttonStyles.icon,
          }}
          onClick={redo}
          disabled={!canRedo}
          title="重做 (Ctrl+Shift+Z)"
        >
          {'\u21AA'}
        </button>
      </div>

      <div style={toolbarStyles.divider} />

      {/* 缩放控制 */}
      <div style={toolbarStyles.group}>
        <button
          style={{ ...buttonStyles.ghost, ...buttonStyles.icon }}
          onClick={handleZoomOut}
          title="缩小"
        >
          {'\u2212'}
        </button>
        <span style={toolbarStyles.zoomLabel}>{zoomPercent}%</span>
        <button
          style={{ ...buttonStyles.ghost, ...buttonStyles.icon }}
          onClick={handleZoomIn}
          title="放大"
        >
          +
        </button>
        <button
          style={{ ...buttonStyles.ghost, ...buttonStyles.icon }}
          onClick={handleZoomReset}
          title="重置缩放"
        >
          {'\u2922'}
        </button>
      </div>

      <div style={toolbarStyles.divider} />

      {/* 布局模式切换 */}
      <div style={toolbarStyles.group}>
        <button
          style={{
            ...(layoutMode === 'free' ? buttonStyles.secondary : buttonStyles.ghost),
            ...buttonStyles.icon,
          }}
          onClick={() => setLayoutMode('free')}
          title="自由布局"
        >
          {'\u25A1'}
        </button>
        <button
          style={{
            ...(layoutMode === 'flow' ? buttonStyles.secondary : buttonStyles.ghost),
            ...buttonStyles.icon,
          }}
          onClick={() => setLayoutMode('flow')}
          title="流式布局"
        >
          {'\u2261'}
        </button>
      </div>

      <div style={toolbarStyles.divider} />

      {/* 预览模式切换 */}
      <div style={toolbarStyles.group}>
        <button
          style={{
            ...(previewMode ? buttonStyles.secondary : buttonStyles.ghost),
            ...buttonStyles.icon,
          }}
          onClick={() => setPreviewMode((v) => !v)}
          title="切换预览"
        >
          {'\u25B6'}
        </button>
      </div>

      <div style={toolbarStyles.divider} />

      {/* 添加组件 */}
      <div style={toolbarStyles.dropdown} ref={menuRef}>
        <button
          style={{ ...buttonStyles.primary, ...buttonStyles.icon }}
          onClick={() => setShowAddMenu((v) => !v)}
          title="添加组件"
        >
          +
        </button>
        {showAddMenu && (
          <div style={toolbarStyles.dropdownMenu}>
            {Object.values(BlockType).map((type) => (
              <button
                key={type}
                style={toolbarStyles.dropdownItem}
                onClick={() => handleAddNode(type)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = colors.bgHover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <span style={toolbarStyles.group}>
                  {BLOCK_TYPE_ICONS[type]}
                </span>
                <span>{BLOCK_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
