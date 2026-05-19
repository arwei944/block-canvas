import React, { useState, useCallback } from 'react';
import { useEditor } from '@block-canvas/react';
import { BlockType, type BlockNode } from '@block-canvas/core';
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
}: {
  node: BlockNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isSelected = node.id === selectedId;

  return (
    <div
      className={`flex h-7 cursor-pointer items-center gap-1.5 pr-2 text-[13px] transition-colors ${
        isSelected
          ? 'bg-blue-500/10 text-blue-400'
          : hovered
            ? 'bg-zinc-800 text-zinc-100'
            : 'text-zinc-300'
      }`}
      style={{ paddingLeft: 8 + depth * 16 }}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-white ${
          TYPE_ICON_COLORS[node.type] || 'bg-zinc-500'
        }`}
      >
        {TYPE_ICONS[node.type] || '?'}
      </span>
      <span className="flex-1 truncate">{node.name || node.id.slice(0, 8)}</span>
      {hovered && (
        <button className="flex h-4 w-4 items-center justify-center rounded text-zinc-500 hover:text-zinc-300">
          <Eye size={12} />
        </button>
      )}
    </div>
  );
}

const LayerPanel: React.FC<LayerPanelProps> = ({ className = '' }) => {
  const { document, selection, selectNode } = useEditor();

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

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 ${className}`}
    >
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-zinc-700/80 bg-zinc-800 px-2">
        <span className="text-xs font-semibold text-zinc-300">图层</span>
        <span className="text-[11px] font-normal text-zinc-500">
          {nodeList.length}
        </span>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {nodeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-zinc-500">
            <Box size={18} className="mb-1 opacity-40" />
            <span className="text-xs">暂无节点</span>
          </div>
        ) : (
          <div className="py-1">
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
