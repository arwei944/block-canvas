import React, { useState, useCallback, useMemo } from 'react';
import { useEditor } from '@block-canvas/react';
import { BlockType } from '@block-canvas/core';
import { useTheme } from '@block-canvas/theme';
import {
  Undo2,
  Redo2,
  ZoomIn,
  Maximize2,
  LayoutGrid,
  Plus,
  Minus,
  Type,
  Image,
  Square,
  Box,
} from 'lucide-react';

export interface ToolbarProps {
  onAddComponent?: (type: string) => void;
  className?: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddComponent, className = '' }) => {
  const { undo, redo, zoom, setZoom } = useEditor();
  const theme = useTheme();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleUndo = useCallback(() => undo(), [undo]);
  const handleRedo = useCallback(() => redo(), [redo]);
  const handleZoomIn = useCallback(
    () => setZoom(Math.min(zoom + 0.1, 3)),
    [zoom, setZoom],
  );
  const handleZoomOut = useCallback(
    () => setZoom(Math.max(zoom - 0.1, 0.1)),
    [zoom, setZoom],
  );
  const handleZoomReset = useCallback(() => setZoom(1), [setZoom]);

  const handleAdd = useCallback(
    (type: string) => {
      setShowAddMenu(false);
      onAddComponent?.(type);
    },
    [onAddComponent],
  );

  const addItems = [
    { type: BlockType.Text, label: '文本', icon: <Type size={14} /> },
    { type: BlockType.Image, label: '图片', icon: <Image size={14} /> },
    { type: BlockType.Button, label: '按钮', icon: <Square size={14} /> },
    { type: BlockType.Container, label: '容器', icon: <Box size={14} /> },
  ];

  const styles = useMemo(() => ({
    container: {
      display: 'flex',
      height: 40,
      flexShrink: 0,
      alignItems: 'center',
      borderBottom: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surface,
      padding: '0 12px',
      userSelect: 'none' as const,
    },
    brand: {
      marginRight: 16,
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: theme.colors.textPrimary,
    },
    divider: {
      margin: '0 8px',
      height: 20,
      width: 1,
      backgroundColor: theme.colors.border,
    },
    iconButton: {
      display: 'flex',
      height: 28,
      width: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.sm,
      color: theme.colors.textSecondary,
      transition: `all ${theme.transitions.fast}`,
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
    },
    zoomText: {
      minWidth: 40,
      textAlign: 'center' as const,
      fontFamily: 'monospace',
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    addButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.surfaceHover,
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 500,
      color: theme.colors.textSecondary,
      transition: `all ${theme.transitions.fast}`,
      cursor: 'pointer',
      border: 'none',
    },
    dropdown: {
      position: 'absolute' as const,
      right: 0,
      top: '100%',
      zIndex: 50,
      marginTop: 4,
      minWidth: 140,
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surfaceHover,
      padding: 4,
      boxShadow: `0 4px 12px ${theme.colors.shadow}`,
    },
    dropdownItem: {
      display: 'flex',
      width: '100%',
      alignItems: 'center',
      gap: 8,
      borderRadius: theme.radius.sm,
      padding: '6px 8px',
      fontSize: 12,
      color: theme.colors.textPrimary,
      transition: `all ${theme.transitions.fast}`,
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
    },
  }), [theme]);

  return (
    <div style={styles.container} className={className}>
      {/* Brand */}
      <span style={styles.brand}>BlockCanvas</span>

      <div style={styles.divider} />

      {/* Undo / Redo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button
          onClick={handleUndo}
          title="撤销"
          style={styles.iconButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
            e.currentTarget.style.color = theme.colors.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.textSecondary;
          }}
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={handleRedo}
          title="重做"
          style={styles.iconButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
            e.currentTarget.style.color = theme.colors.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.textSecondary;
          }}
        >
          <Redo2 size={14} />
        </button>
      </div>

      <div style={styles.divider} />

      {/* Zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button
          onClick={handleZoomOut}
          title="缩小"
          style={styles.iconButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
            e.currentTarget.style.color = theme.colors.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.textSecondary;
          }}
        >
          <Minus size={14} />
        </button>
        <span style={styles.zoomText}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          title="放大"
          style={styles.iconButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
            e.currentTarget.style.color = theme.colors.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.textSecondary;
          }}
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={handleZoomReset}
          title="重置缩放"
          style={styles.iconButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
            e.currentTarget.style.color = theme.colors.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.textSecondary;
          }}
        >
          <Maximize2 size={14} />
        </button>
      </div>

      <div style={styles.divider} />

      {/* Layout toggle */}
      <button
        title="布局切换"
        style={styles.iconButton}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
          e.currentTarget.style.color = theme.colors.textPrimary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = theme.colors.textSecondary;
        }}
      >
        <LayoutGrid size={14} />
      </button>

      <div style={{ flex: 1 }} />

      {/* Add component */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          style={styles.addButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.border;
            e.currentTarget.style.color = theme.colors.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
            e.currentTarget.style.color = theme.colors.textSecondary;
          }}
        >
          <Plus size={12} />
          添加
        </button>
        {showAddMenu && (
          <div style={styles.dropdown}>
            {addItems.map((item) => (
              <button
                key={item.type}
                style={styles.dropdownItem}
                onClick={() => handleAdd(item.type)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surfaceSelected;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ color: theme.colors.textTertiary }}>{item.icon}</span>
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
