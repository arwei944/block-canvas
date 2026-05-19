import React, { useCallback } from 'react';
import { useEditor } from '@block-canvas/react';
import { useEditorStore, BlockType, type BlockNode } from '@block-canvas/core';
import { Square } from 'lucide-react';

export interface PropertyPanelProps {
  className?: string;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ className = '' }) => {
  const { document, selection } = useEditor();
  const selectedId = selection?.selectedIds?.[0];
  const nodes = document?.nodes || {};
  const node: BlockNode | undefined = selectedId ? nodes[selectedId] : undefined;

  const updateStyle = useCallback(
    (key: string, value: string) => {
      if (!selectedId) return;
      const current = useEditorStore.getState().document?.nodes[selectedId];
      if (current) {
        useEditorStore.getState().updateNodeStyle(selectedId, { [key]: value });
      }
    },
    [selectedId],
  );

  const updateData = useCallback(
    (key: string, value: unknown) => {
      if (!selectedId) return;
      const current = useEditorStore.getState().document?.nodes[selectedId];
      if (current) {
        useEditorStore.getState().updateNode(selectedId, {
          data: { ...current.data, [key]: value },
        });
      }
    },
    [selectedId],
  );

  if (!node) {
    return (
      <div
        className={`flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 ${className}`}
      >
        <div className="flex h-8 shrink-0 items-center justify-between border-b border-zinc-700/80 bg-zinc-800 px-2">
          <span className="text-xs font-semibold text-zinc-300">属性</span>
        </div>
        <div className="flex flex-1 items-center justify-center p-3">
          <div className="flex flex-col items-center justify-center py-6 text-zinc-500">
            <Square size={20} className="mb-1 opacity-30" />
            <span className="text-xs">选择一个节点以编辑属性</span>
          </div>
        </div>
      </div>
    );
  }

  const nodeStyle = node.style || {};
  const data = node.data || {};

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 ${className}`}
    >
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-zinc-700/80 bg-zinc-800 px-2">
        <span className="text-xs font-semibold text-zinc-300">属性</span>
        <span className="text-[11px] font-normal text-zinc-500">
          {node.name || node.type}
        </span>
      </div>
      <div className="flex-1 overflow-auto p-3">
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
              <div className="flex h-[30px] items-center rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] capitalize text-zinc-500">
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
      </div>
    </div>
  );
};

export { PropertyPanel };
