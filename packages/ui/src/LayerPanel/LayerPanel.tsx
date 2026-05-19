import React, { useState, useCallback } from 'react';
import { useEditor } from '@block-canvas/react';
import { BlockType, type BlockNode } from '@block-canvas/core';
import {
  panelStyles,
  layerTreeStyles,
  colors,
  typeIconColors,
} from '../shared/styles';

interface LayerPanelProps {
  style?: React.CSSProperties;
}

const TYPE_LABELS: Record<string, string> = {
  [BlockType.Text]: 'T',
  [BlockType.Image]: '▣',
  [BlockType.Button]: '▢',
  [BlockType.Container]: '⊞',
};

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: BlockNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isSelected = node.id === selectedId;
  const isContainer = node.type === BlockType.Container;
  const children = isContainer ? (node.props.children as string[]) || [] : [];

  const rowStyle = isSelected
    ? layerTreeStyles.nodeRowSelected
    : hovered
      ? layerTreeStyles.nodeRowHover
      : layerTreeStyles.nodeRow;

  const iconBg = typeIconColors[node.type] || colors.textTertiary;

  return (
    <div>
      <div
        style={{ ...rowStyle, paddingLeft: 8 + depth * 16 }}
        onClick={() => onSelect(node.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 类型图标 */}
        <span
          style={{
            ...layerTreeStyles.nodeIcon,
            backgroundColor: iconBg,
            color: '#fff',
          }}
        >
          {TYPE_LABELS[node.type] || '?'}
        </span>

        {/* 名称 */}
        <span style={layerTreeStyles.nodeName}>{node.name || node.id.slice(0, 8)}</span>
      </div>

      {/* 子节点 */}
      {children.map((childId) => {
        // 子节点会在扁平节点列表中渲染，这里只做缩进标记
        return null;
      })}
    </div>
  );
}

const LayerPanel: React.FC<LayerPanelProps> = ({ style }) => {
  const { document, selectedIds, selectNode } = useEditor();

  const handleSelect = useCallback(
    (id: string) => selectNode(id),
    [selectNode],
  );

  const nodes = document?.nodes || {};
  const nodeList = Object.values(nodes);
  const selectedId = selectedIds?.[0] || null;

  // 构建树：只显示根节点的直接子节点（扁平化展示）
  const rootId = document?.rootId;
  const rootChildren: string[] =
    rootId && nodes[rootId]?.type === BlockType.Container
      ? (nodes[rootId].props.children as string[]) || []
      : [];

  return (
    <div style={{ ...panelStyles.container, ...style }}>
      <div style={panelStyles.header}>
        <span>图层</span>
        <span style={{ fontSize: 11, fontWeight: 400, color: colors.textTertiary }}>
          {nodeList.length}
        </span>
      </div>
      <div style={panelStyles.body}>
        {nodeList.length === 0 ? (
          <div style={panelStyles.emptyState}>
            <span style={{ fontSize: 18, opacity: 0.4 }}>⊞</span>
            <span>暂无节点</span>
          </div>
        ) : (
          <div style={layerTreeStyles.container}>
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
