import React, { useCallback, useState } from 'react';
import { useEditor } from '@block-canvas/react';
import { BlockType } from '@block-canvas/core';
import type { BlockId, BlockNode } from '@block-canvas/core';
import { panelStyles, layerTreeStyles, colors } from '../shared/styles';

const TYPE_ICONS: Record<string, string> = {
  [BlockType.Text]: 'T',
  [BlockType.Image]: '\u{1F5BC}',
  [BlockType.Button]: '\u25A3',
  [BlockType.Container]: '\u25A1',
};

interface TreeNodeProps {
  nodeId: BlockId;
  node: BlockNode;
  depth: number;
  selectedIds: BlockId[];
  onSelect: (id: BlockId) => void;
  onToggleVisible: (id: BlockId) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  nodeId,
  node,
  depth,
  selectedIds,
  onSelect,
  onToggleVisible,
}) => {
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedIds.includes(nodeId);

  const rowStyle = isSelected
    ? layerTreeStyles.nodeRowSelected
    : hovered
      ? layerTreeStyles.nodeRowHover
      : layerTreeStyles.nodeRow;

  return (
    <div>
      <div
        style={{
          ...rowStyle,
          paddingLeft: 8 + depth * 20,
        }}
        onClick={() => onSelect(nodeId)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={layerTreeStyles.nodeIcon}>
          {TYPE_ICONS[node.type] || '?'}
        </span>
        <span style={layerTreeStyles.nodeName}>{node.name}</span>
        <button
          style={{
            ...layerTreeStyles.visibilityBtn,
            opacity: node.visible === false ? 0.3 : 0.6,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible(nodeId);
          }}
          title={node.visible === false ? '显示' : '隐藏'}
        >
          {node.visible === false ? '\u{1F441}\u200D\u{1F5E8}' : '\u{1F441}'}
        </button>
      </div>
      {/* 递归渲染子节点 */}
      {node.type === BlockType.Container &&
        node.props.children.map((childId) => {
          // 子节点由父组件在完整节点映射中查找
          return null; // 占位，实际渲染在 LayerPanel 中处理
        })}
    </div>
  );
};

export interface LayerPanelProps {
  style?: React.CSSProperties;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({ style }) => {
  const { document, selection, selectNode, updateNode } = useEditor();

  const handleSelect = useCallback(
    (nodeId: BlockId) => {
      selectNode(nodeId);
    },
    [selectNode],
  );

  const handleToggleVisible = useCallback(
    (nodeId: BlockId) => {
      const node = document?.nodes[nodeId];
      if (!node) return;
      updateNode(nodeId, { visible: !node.visible });
    },
    [document, updateNode],
  );

  // 递归渲染节点树
  const renderNode = (nodeId: BlockId, depth: number): React.ReactNode => {
    const node = document?.nodes[nodeId];
    if (!node) return null;

    const children: React.ReactNode[] = [
      <TreeNode
        key={nodeId}
        nodeId={nodeId}
        node={node}
        depth={depth}
        selectedIds={selection.selectedIds}
        onSelect={handleSelect}
        onToggleVisible={handleToggleVisible}
      />,
    ];

    if (node.type === BlockType.Container) {
      for (const childId of node.props.children) {
        children.push(renderNode(childId, depth + 1));
      }
    }

    return <React.Fragment key={nodeId}>{children}</React.Fragment>;
  };

  if (!document) {
    return (
      <div style={{ ...panelStyles.container, ...style }}>
        <div style={panelStyles.header}>图层</div>
        <div style={panelStyles.emptyState}>未加载文档</div>
      </div>
    );
  }

  const rootNode = document.nodes[document.rootId];

  return (
    <div style={{ ...panelStyles.container, ...style }}>
      <div style={panelStyles.header}>
        <span>图层</span>
        <span style={{ fontSize: 11, color: colors.textTertiary, fontWeight: 400 }}>
          {Object.keys(document.nodes).length} 个节点
        </span>
      </div>
      <div style={{ ...panelStyles.body, ...layerTreeStyles.container }}>
        {rootNode ? renderNode(document.rootId, 0) : null}
      </div>
    </div>
  );
};
