import React, { useState, useCallback } from 'react';
import { useEditor } from '@block-canvas/react';
import { BlockType } from '@block-canvas/core';
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

  return (
    <div
      className={`flex h-10 shrink-0 items-center border-b border-zinc-800 bg-zinc-900 px-3 select-none ${className}`}
    >
      {/* Brand */}
      <span className="mr-4 text-sm font-bold tracking-tight text-zinc-100">
        BlockCanvas
      </span>

      <div className="mx-2 h-5 w-px bg-zinc-800" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleUndo}
          title="撤销"
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={handleRedo}
          title="重做"
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          <Redo2 size={14} />
        </button>
      </div>

      <div className="mx-2 h-5 w-px bg-zinc-800" />

      {/* Zoom */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleZoomOut}
          title="缩小"
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          <Minus size={14} />
        </button>
        <span className="min-w-[40px] text-center font-mono text-xs text-zinc-500">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          title="放大"
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={handleZoomReset}
          title="重置缩放"
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      <div className="mx-2 h-5 w-px bg-zinc-800" />

      {/* Layout toggle */}
      <button
        title="布局切换"
        className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
      >
        <LayoutGrid size={14} />
      </button>

      <div className="flex-1" />

      {/* Add component */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          <Plus size={12} />
          添加
        </button>
        {showAddMenu && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-zinc-700 bg-zinc-800 p-1 shadow-xl">
            {addItems.map((item) => (
              <button
                key={item.type}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
                onClick={() => handleAdd(item.type)}
              >
                <span className="text-zinc-500">{item.icon}</span>
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
