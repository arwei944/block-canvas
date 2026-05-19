import React, { useState, useCallback } from 'react';
import { useEditor } from '@block-canvas/react';
import { BlockType } from '@block-canvas/core';
import {
  toolbarStyles,
  buttonStyles,
  colors,
  fontSize,
} from '../shared/styles';

interface ToolbarProps {
  style?: React.CSSProperties;
}

const Toolbar: React.FC<ToolbarProps> = ({ style }) => {
  const { undo, redo, zoom, setZoom, layoutMode, setLayoutMode } = useEditor();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleUndo = useCallback(() => undo(), [undo]);
  const handleRedo = useCallback(() => redo(), [redo]);
  const handleZoomIn = useCallback(() => setZoom(Math.min(zoom + 0.1, 3)), [zoom, setZoom]);
  const handleZoomOut = useCallback(() => setZoom(Math.max(zoom - 0.1, 0.1)), [zoom, setZoom]);
  const handleZoomReset = useCallback(() => setZoom(1), [setZoom]);
  const handleToggleLayout = useCallback(
    () => setLayoutMode(layoutMode === 'free' ? 'flow' : 'free'),
    [layoutMode, setLayoutMode],
  );

  const btnBase = (active?: boolean): React.CSSProperties => ({
    ...buttonStyles.icon,
    backgroundColor: active ? colors.active : 'transparent',
    color: active ? colors.textPrimary : colors.textSecondary,
  });

  const btnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    const t = e.currentTarget as HTMLElement;
    if (!t.style.backgroundColor || t.style.backgroundColor === 'transparent') {
      t.style.backgroundColor = colors.hover;
    }
  };
  const btnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const t = e.currentTarget as HTMLElement;
    t.style.backgroundColor = t.dataset.active === '1' ? colors.active : 'transparent';
  };

  return (
    <div style={{ ...toolbarStyles.container, ...style }}>
      {/* 品牌 */}
      <span style={toolbarStyles.brand}>BlockCanvas</span>

      <div style={toolbarStyles.divider} />

      {/* 撤销 / 重做 */}
      <div style={toolbarStyles.group}>
        <button
          style={btnBase()}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
          onClick={handleUndo}
          title="撤销"
        >
          ↶
        </button>
        <button
          style={btnBase()}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
          onClick={handleRedo}
          title="重做"
        >
          ↷
        </button>
      </div>

      <div style={toolbarStyles.divider} />

      {/* 缩放 */}
      <div style={toolbarStyles.group}>
        <button
          style={btnBase()}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
          onClick={handleZoomOut}
          title="缩小"
        >
          −
        </button>
        <span style={toolbarStyles.zoomLabel}>{Math.round(zoom * 100)}%</span>
        <button
          style={btnBase()}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
          onClick={handleZoomIn}
          title="放大"
        >
          +
        </button>
        <button
          style={btnBase()}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
          onClick={handleZoomReset}
          title="重置缩放"
        >
          ⊡
        </button>
      </div>

      <div style={toolbarStyles.divider} />

      {/* 布局切换 */}
      <button
        style={btnBase(layoutMode === 'flow')}
        data-active={layoutMode === 'flow' ? '1' : '0'}
        onMouseEnter={btnHover}
        onMouseLeave={btnLeave}
        onClick={handleToggleLayout}
        title={layoutMode === 'free' ? '切换到流式布局' : '切换到自由布局'}
      >
        {layoutMode === 'free' ? '⊞' : '☰'}
      </button>

      <div style={toolbarStyles.spacer} />

      {/* 添加组件 */}
      <div style={toolbarStyles.dropdown}>
        <button
          style={{ ...btnBase(), gap: 4, padding: '4px 10px', fontSize: fontSize.md, fontWeight: 500 }}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          + 添加
        </button>
        {showAddMenu && (
          <div style={toolbarStyles.dropdownMenu}>
            {[
              { type: BlockType.Text, label: '文本', icon: 'T' },
              { type: BlockType.Image, label: '图片', icon: '▣' },
              { type: BlockType.Button, label: '按钮', icon: '▢' },
              { type: BlockType.Container, label: '容器', icon: '⊞' },
            ].map((item) => (
              <button
                key={item.type}
                style={toolbarStyles.dropdownItem}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => setShowAddMenu(false)}
              >
                <span style={{ width: 16, textAlign: 'center', fontSize: 12, color: colors.textTertiary }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { Toolbar };
