import React, { useEffect, useCallback, useState } from 'react';
import {
  EditorProvider,
  useEditor,
  Canvas,
  setComponentRegistry,
} from '@block-canvas/react';
import {
  BlockType,
  createDocument,
  createTextBlock,
  createImageBlock,
  createButtonBlock,
  createContainerBlock,
  useEditorStore,
  loadFromLocalStorage,
  enableAutoSave,
  type BlockNode,
} from '@block-canvas/core';
import { getAllComponents } from '@block-canvas/components';
import { useTheme, ThemeProvider } from './providers/ThemeProvider';
import { useSSESync } from './hooks/useSSESync';
import type { BlockDocument } from '@block-canvas/core';

import {
  Undo2,
  Redo2,
  ZoomIn,
  Maximize2,
  LayoutGrid,
  Plus,
  Sun,
  Moon,
  Minus,
  RotateCcw,
  Check,
  RefreshCw,
  Eye,
  Type,
  Image,
  Square,
  Box,
} from 'lucide-react';

// ============================================================
// Sample Document
// ============================================================

function createSampleDocument(): BlockDocument {
  const doc = createDocument('演练场示例');

  const textNode1 = createTextBlock('欢迎使用 BlockCanvas', {
    name: '标题',
    style: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1d1d1f',
      padding: '0',
      textAlign: 'left',
    },
  });

  const textNode2 = createTextBlock(
    '面向智能体的可视化画布前端框架，像搭积木一样构建页面。',
    {
      name: '副标题',
      style: {
        fontSize: '14px',
        color: '#6b6b76',
        padding: '0',
        textAlign: 'left',
        lineHeight: '1.6',
      },
    },
  );

  const buttonNode1 = createButtonBlock('开始使用', {
    name: '主按钮',
    style: {
      width: 'fit-content',
      padding: '8px 20px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '500',
    },
    props: { label: '开始使用', variant: 'primary' },
  });

  const buttonNode2 = createButtonBlock('查看文档', {
    name: '次按钮',
    style: {
      width: 'fit-content',
      padding: '8px 20px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '500',
    },
    props: { label: '查看文档', variant: 'secondary' },
  });

  const imageNode1 = createImageBlock(
    'https://picsum.photos/seed/blockcanvas2/480/220',
    {
      name: '封面图',
      style: {
        width: '100%',
        height: '200px',
        borderRadius: '8px',
        objectFit: 'cover',
      },
      props: { src: 'https://picsum.photos/seed/blockcanvas2/480/220', alt: '封面图', objectFit: 'cover' },
    },
  );

  const containerNode = createContainerBlock(
    [textNode1.id, textNode2.id, imageNode1.id, buttonNode1.id, buttonNode2.id],
    {
      name: '卡片',
      style: {
        width: '480px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        padding: '32px',
        gap: 16,
        alignItems: 'flex-start',
      },
    },
  );

  const rootNode = doc.nodes[doc.rootId];
  if (rootNode && rootNode.type === BlockType.Container) {
    rootNode.props.children = [containerNode.id];
  }

  doc.nodes = {
    ...doc.nodes,
    [textNode1.id]: textNode1,
    [textNode2.id]: textNode2,
    [buttonNode1.id]: buttonNode1,
    [buttonNode2.id]: buttonNode2,
    [imageNode1.id]: imageNode1,
    [containerNode.id]: containerNode,
  };

  return doc;
}

// ============================================================
// Shared Components
// ============================================================

function PanelCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string | number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-zinc-700/80 bg-zinc-800 px-2">
        <span className="text-xs font-semibold text-zinc-300">{title}</span>
        {badge !== undefined && (
          <span className="text-[11px] font-normal text-zinc-500">{badge}</span>
        )}
      </div>
      <div className="flex-1 overflow-auto p-3">{children}</div>
    </div>
  );
}

function ToolbarButton({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
        active
          ? 'bg-blue-500 text-white'
          : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-2 h-5 w-px bg-zinc-800" />;
}

// ============================================================
// Toolbar
// ============================================================

function AppToolbar() {
  const { undo, redo, zoom, setZoom } = useEditor();
  const { theme, toggleTheme } = useTheme();
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

  const addItems = [
    { type: BlockType.Text, label: '文本', icon: <Type size={14} /> },
    { type: BlockType.Image, label: '图片', icon: <Image size={14} /> },
    { type: BlockType.Button, label: '按钮', icon: <Square size={14} /> },
    { type: BlockType.Container, label: '容器', icon: <Box size={14} /> },
  ];

  return (
    <div className="flex h-10 shrink-0 items-center border-b border-zinc-800 bg-zinc-900 px-3 select-none">
      {/* Brand */}
      <span className="mr-4 text-sm font-bold tracking-tight text-zinc-100">
        BlockCanvas
      </span>

      <ToolbarDivider />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton onClick={handleUndo} title="撤销">
          <Undo2 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={handleRedo} title="重做">
          <Redo2 size={14} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* Zoom */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton onClick={handleZoomOut} title="缩小">
          <Minus size={14} />
        </ToolbarButton>
        <span className="min-w-[40px] text-center font-mono text-xs text-zinc-500">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton onClick={handleZoomIn} title="放大">
          <ZoomIn size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={handleZoomReset} title="重置缩放">
          <Maximize2 size={14} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* Layout toggle */}
      <ToolbarButton title="布局切换">
        <LayoutGrid size={14} />
      </ToolbarButton>

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
                onClick={() => setShowAddMenu(false)}
              >
                <span className="text-zinc-500">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <div className="ml-2">
        <ToolbarButton onClick={toggleTheme} title="切换主题">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </ToolbarButton>
      </div>
    </div>
  );
}

// ============================================================
// Layer Panel
// ============================================================

const TYPE_ICON_COLORS: Record<string, string> = {
  [BlockType.Text]: 'bg-blue-500',
  [BlockType.Image]: 'bg-purple-500',
  [BlockType.Button]: 'bg-green-500',
  [BlockType.Container]: 'bg-amber-500',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  [BlockType.Text]: <Type size={10} />,
  [BlockType.Image]: <Image size={10} />,
  [BlockType.Button]: <Square size={10} />,
  [BlockType.Container]: <Box size={10} />,
};

function LayerTreeNode({
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

function LayerPanelContent() {
  const { document, selection, selectNode } = useEditor();

  const handleSelect = useCallback(
    (id: string) => selectNode(id),
    [selectNode],
  );

  const nodes = document?.nodes || {};
  const nodeList = Object.values(nodes);
  const selectedId = selection?.selectedIds?.[0] || null;

  const rootId = document?.rootId;
  const rootChildren: string[] =
    rootId && nodes[rootId]?.type === BlockType.Container
      ? (nodes[rootId].props.children as string[]) || []
      : [];

  if (nodeList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-zinc-500">
        <Box size={18} className="mb-1 opacity-40" />
        <span className="text-xs">暂无节点</span>
      </div>
    );
  }

  return (
    <div className="py-1">
      {rootChildren.map((id) => {
        const node = nodes[id];
        if (!node) return null;
        return (
          <LayerTreeNode
            key={id}
            node={node}
            depth={0}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// Property Panel
// ============================================================

function PropertyPanelContent() {
  const { document, selection } = useEditor();
  const selectedId = selection?.selectedIds?.[0];
  const nodes = document?.nodes || {};
  const node: BlockNode | undefined = selectedId ? nodes[selectedId] : undefined;

  const updateStyle = useCallback(
    (key: string, value: string) => {
      if (!selectedId) return;
      const store = useEditorStore;
      const current = store.getState().document?.nodes[selectedId];
      if (current) {
        store.getState().updateNodeStyle(selectedId, { [key]: value });
      }
    },
    [selectedId],
  );

  const updateData = useCallback(
    (key: string, value: unknown) => {
      if (!selectedId) return;
      const store = useEditorStore;
      const current = store.getState().document?.nodes[selectedId];
      if (current) {
        store.getState().updateNode(selectedId, {
          data: { ...current.data, [key]: value },
        });
      }
    },
    [selectedId],
  );

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-zinc-500">
        <Square size={20} className="mb-1 opacity-30" />
        <span className="text-xs">选择一个节点以编辑属性</span>
      </div>
    );
  }

  const nodeStyle = node.style || {};
  const data = node.data || {};

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          基本信息
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            名称
          </label>
          <input
            className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
            value={node.name || ''}
            onChange={(e) => console.log('Update name:', e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            类型
          </label>
          <div className="h-[30px] flex items-center rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] capitalize text-zinc-500">
            {node.type}
          </div>
        </div>
      </div>

      {/* Position & Size */}
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          位置与尺寸
        </div>
        <div className="mb-3 flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              X
            </label>
            <input
              className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
              value={node.layout?.left ?? 0}
              type="number"
              onChange={(e) => console.log('x:', e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Y
            </label>
            <input
              className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
              value={node.layout?.top ?? 0}
              type="number"
              onChange={(e) => console.log('y:', e.target.value)}
            />
          </div>
        </div>
        <div className="mb-3 flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              宽度
            </label>
            <input
              className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
              value={nodeStyle.width || 'auto'}
              onChange={(e) => updateStyle('width', e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              高度
            </label>
            <input
              className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
              value={nodeStyle.height || 'auto'}
              onChange={(e) => updateStyle('height', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Styles */}
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          样式
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            背景色
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-[30px] w-[30px] cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
              value={nodeStyle.backgroundColor || '#ffffff'}
              onChange={(e) => updateStyle('backgroundColor', e.target.value)}
            />
            <input
              className="h-[30px] flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 font-mono text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
              value={nodeStyle.backgroundColor || '#ffffff'}
              onChange={(e) => updateStyle('backgroundColor', e.target.value)}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            文字颜色
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-[30px] w-[30px] cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
              value={nodeStyle.color || '#000000'}
              onChange={(e) => updateStyle('color', e.target.value)}
            />
            <input
              className="h-[30px] flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 font-mono text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
              value={nodeStyle.color || '#000000'}
              onChange={(e) => updateStyle('color', e.target.value)}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            字号
          </label>
          <input
            className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
            value={nodeStyle.fontSize || ''}
            placeholder="例: 14px"
            onChange={(e) => updateStyle('fontSize', e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            圆角
          </label>
          <input
            className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
            value={nodeStyle.borderRadius || ''}
            placeholder="例: 8px"
            onChange={(e) => updateStyle('borderRadius', e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            内边距
          </label>
          <input
            className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
            value={nodeStyle.padding || ''}
            placeholder="例: 16px"
            onChange={(e) => updateStyle('padding', e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            文字对齐
          </label>
          <select
            className="h-[30px] w-full appearance-none rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
            value={nodeStyle.textAlign || 'left'}
            onChange={(e) => updateStyle('textAlign', e.target.value)}
          >
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
          </select>
        </div>
      </div>

      {/* Text content (text type only) */}
      {node.type === BlockType.Text && (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            文本内容
          </div>
          <div className="mb-3">
            <textarea
              className="h-20 w-full resize-y rounded border border-zinc-700 bg-zinc-800 p-2 text-[13px] leading-relaxed text-zinc-200 outline-none transition-colors focus:border-blue-500"
              value={(data.content as string) || ''}
              onChange={(e) => updateData('content', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Image (image type only) */}
      {node.type === BlockType.Image && (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            图片
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              图片地址
            </label>
            <input
              className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
              value={(data.src as string) || ''}
              placeholder="https://..."
              onChange={(e) => updateData('src', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Button (button type only) */}
      {node.type === BlockType.Button && (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            按钮
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              按钮文字
            </label>
            <input
              className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
              value={(data.content as string) || ''}
              onChange={(e) => updateData('content', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              变体
            </label>
            <select
              className="h-[30px] w-full appearance-none rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500"
              value={(node.props.variant as string) || 'primary'}
              onChange={(e) => console.log('variant:', e.target.value)}
            >
              <option value="primary">主要</option>
              <option value="secondary">次要</option>
              <option value="ghost">幽灵</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Supervisor Panel
// ============================================================

interface LogEntry {
  id: string;
  time: string;
  description: string;
  status: 'success' | 'pending' | 'error';
}

const STATUS_DOT_COLORS: Record<string, string> = {
  success: 'bg-green-500',
  pending: 'bg-purple-500',
  error: 'bg-red-500',
};

function SupervisorPanelContent({
  onApprove,
  onRequestChange,
  onRollback,
}: {
  onApprove?: () => void;
  onRequestChange?: () => void;
  onRollback?: () => void;
}) {
  const logs: LogEntry[] = [
    { id: '1', time: '22:15:01', description: '初始化文档 "演练场示例"', status: 'success' },
    { id: '2', time: '22:15:01', description: '添加文本节点 "标题"', status: 'success' },
    { id: '3', time: '22:15:01', description: '添加文本节点 "副标题"', status: 'success' },
    { id: '4', time: '22:15:01', description: '添加图片节点 "封面图"', status: 'success' },
    { id: '5', time: '22:15:01', description: '添加按钮节点 "主按钮"', status: 'success' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto px-3 py-1">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center py-4 text-zinc-500">
            <span className="text-xs">暂无操作记录</span>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex h-[30px] items-center gap-2 rounded px-2 text-xs transition-colors hover:bg-zinc-800"
            >
              <span className="min-w-[52px] shrink-0 font-mono text-[11px] text-zinc-600">
                {log.time}
              </span>
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  STATUS_DOT_COLORS[log.status] || 'bg-zinc-500'
                }`}
              />
              <span className="flex-1 truncate text-zinc-400">
                {log.description}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="flex shrink-0 gap-1.5 border-t border-zinc-700/80 bg-zinc-800 px-3 py-1.5">
        <button
          onClick={onApprove}
          className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-green-500"
        >
          <Check size={12} />
          批准
        </button>
        <button
          onClick={onRequestChange}
          className="flex items-center gap-1 rounded-md bg-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-600"
        >
          <RefreshCw size={12} />
          请求修改
        </button>
        <button
          onClick={onRollback}
          className="flex items-center gap-1 rounded-md bg-transparent px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          <RotateCcw size={12} />
          回滚
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Editor App
// ============================================================

const EditorApp: React.FC = () => {
  const { document, redo } = useEditor();
  useSSESync(); // Connect to MCP Server SSE

  useEffect(() => {
    // Try localStorage first, then sample
    const saved = loadFromLocalStorage();
    if (saved) {
      useEditorStore.getState().initDocument(saved);
    } else if (!useEditorStore.getState().document) {
      const sampleDoc = createSampleDocument();
      useEditorStore.getState().initDocument(sampleDoc);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = enableAutoSave();
    return unsubscribe;
  }, []);

  const handleApprove = useCallback(() => {
    console.log('[Supervisor] Approved');
  }, []);

  const handleRequestChange = useCallback(() => {
    console.log('[Supervisor] Changes requested');
  }, []);

  const handleRollback = useCallback(() => {
    if (document) redo();
  }, [document, redo]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Top Toolbar */}
      <AppToolbar />

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Layers */}
        <div className="w-64 shrink-0 border-r border-zinc-800 p-2">
          <PanelCard title="图层" badge={Object.values(document?.nodes || {}).length}>
            <LayerPanelContent />
          </PanelCard>
        </div>

        {/* Center - Canvas */}
        <div className="flex flex-1 items-center justify-center overflow-hidden bg-zinc-950 canvas-grid-dark">
          <Canvas />
        </div>

        {/* Right Panel - Properties */}
        <div className="w-72 shrink-0 border-l border-zinc-800 p-2">
          <PanelCard title="属性">
            <PropertyPanelContent />
          </PanelCard>
        </div>
      </div>

      {/* Bottom Panel - Supervisor */}
      <div className="h-44 shrink-0 border-t border-zinc-800 p-2">
        <PanelCard title="操作日志" badge="5 条记录">
          <SupervisorPanelContent
            onApprove={handleApprove}
            onRequestChange={handleRequestChange}
            onRollback={handleRollback}
          />
        </PanelCard>
      </div>
    </div>
  );
};

// ============================================================
// App Root
// ============================================================

const App: React.FC = () => {
  useEffect(() => {
    const allComponents = getAllComponents();
    setComponentRegistry(allComponents);
  }, []);

  return (
    <ThemeProvider>
      <EditorProvider>
        <EditorApp />
      </EditorProvider>
    </ThemeProvider>
  );
};

export default App;
