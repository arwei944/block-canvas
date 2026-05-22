import React, { useState, useCallback, useMemo } from 'react';
import { useEditor } from '@block-canvas/react';
import { BlockType, type BlockNode } from '@block-canvas/core';
import { useTheme } from '@block-canvas/theme';
import { TYPE_ICON_COLORS } from '../shared/constants';
import { Eye, Type, Image, Square, Box } from 'lucide-react';

export interface LayerPanelProps {
  className?: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  [BlockType.Text]: <Type size={10} />,
  [BlockType.Image]: <Image size={10} />,
  [BlockType.Button]: <Square size={10} />,
  [BlockType.Container]: <Box size={10} />,
};

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  theme,
}: {
  node: BlockNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const [hovered, setHovered] = useState(false);
  const isSelected = node.id === selectedId;

  const nodeStyle = useMemo(() => ({
    display: 'flex',
    height: 28,
    cursor: 'pointer',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
    fontSize: 13,
    transition: `all ${theme.transitions.fast}`,
    backgroundColor: isSelected
      ? theme.colors.surfaceSelected
      : hovered
        ? theme.colors.surfaceHover
        : 'transparent',
    color: isSelected
      ? theme.colors.primary
      : hovered
        ? theme.colors.textPrimary
        : theme.colors.textPrimary,
    paddingLeft: 8 + depth * 16,
  }), [isSelected, hovered, depth, theme]);

  const iconBgColor = TYPE_ICON_COLORS[node.type] || theme.colors.textTertiary;

  return (
    <div
      style={nodeStyle}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          display: 'flex',
          height: 16,
          width: 16,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius.sm,
          color: '#fff',
          backgroundColor: iconBgColor,
        }}
      >
        {TYPE_ICONS[node.type] || '?'}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {node.name || node.id.slice(0, 8)}
      </span>
      {hovered && (
        <button style={{
          display: 'flex',
          height: 16,
          width: 16,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius.sm,
          color: theme.colors.textTertiary,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
        }}>
          <Eye size={12} />
        </button>
      )}
    </div>
  );
}

const LayerPanel: React.FC<LayerPanelProps> = ({ className = '' }) => {
  const { document, selection, selectNode } = useEditor();
  const theme = useTheme();

  const handleSelect = useCallback(
    (id: string) => selectNode(id),
    [selectNode],
  );

  const nodes = document?.nodes || {};
  const nodeList = Object.values(nodes);
  const selectedId = selection?.selectedIds?.[0] || null;

  // Build tree: only show root's direct children (flat display)
  const rootId = document?.rootId;
  const rootChildren: string[] =
    rootId && nodes[rootId]?.type === BlockType.Container
      ? (nodes[rootId].props.children as string[]) || []
      : [];

  const styles = useMemo(() => ({
    container: {
      display: 'flex',
      height: '100%',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surface,
    },
    header: {
      display: 'flex',
      height: 32,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'space-between' as const,
      borderBottom: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surfaceHover,
      padding: '0 8px',
    },
    headerTitle: {
      fontSize: 12,
      fontWeight: 600,
      color: theme.colors.textPrimary,
    },
    headerCount: {
      fontSize: 11,
      fontWeight: 400,
      color: theme.colors.textTertiary,
    },
    content: {
      flex: 1,
      overflow: 'auto',
      padding: 12,
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 0',
      color: theme.colors.textTertiary,
    },
  }), [theme]);

  return (
    <div style={styles.container} className={className}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>图层</span>
        <span style={styles.headerCount}>{nodeList.length}</span>
      </div>
      <div style={styles.content}>
        {nodeList.length === 0 ? (
          <div style={styles.emptyState}>
            <Box size={18} style={{ marginBottom: 4, opacity: 0.4 }} />
            <span style={{ fontSize: 12 }}>暂无节点</span>
          </div>
        ) : (
          <div style={{ padding: '4px 0' }}>
            {rootChildren.map((id) => {
              const node = nodes[id];
              if (!node) return null;
              return (
                <TreeNode
                  key={id}
                  node={node}
                  depth={0}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  theme={theme}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export { LayerPanel };
