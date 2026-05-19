import React, { useCallback } from 'react';
import { useEditor } from '@block-canvas/react';
import { BlockType, type BlockNode } from '@block-canvas/core';
import {
  panelStyles,
  inputStyles,
  selectStyles,
  colorFieldStyles,
  colors,
  spacing,
} from '../shared/styles';

interface PropertyPanelProps {
  style?: React.CSSProperties;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ style: panelStyle }) => {
  const { document, selectedIds } = useEditor();
  const selectedId = selectedIds?.[0];
  const nodes = document?.nodes || {};
  const node: BlockNode | undefined = selectedId ? nodes[selectedId] : undefined;

  const updateStyle = useCallback(
    (key: string, value: string) => {
      if (!selectedId) return;
      const store = (useEditor as any).__storeRef?.();
      // 简单的 style 更新
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
      const store = (useEditor as any).__storeRef?.();
      const current = store.getState().document?.nodes[selectedId];
      if (current) {
        store.getState().updateNodeData(selectedId, { [key]: value });
      }
    },
    [selectedId],
  );

  if (!node) {
    return (
      <div style={{ ...panelStyles.container, ...panelStyle }}>
        <div style={panelStyles.header}>属性</div>
        <div style={panelStyles.emptyState}>
          <span style={{ fontSize: 20, opacity: 0.3 }}>⬚</span>
          <span>选择一个节点以编辑属性</span>
        </div>
      </div>
    );
  }

  const nodeStyle = node.style || {};
  const data = node.data || {};

  return (
    <div style={{ ...panelStyles.container, ...panelStyle }}>
      <div style={panelStyles.header}>
        <span>属性</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: colors.textTertiary,
            textTransform: 'none',
            letterSpacing: 0,
          }}
        >
          {node.name || node.type}
        </span>
      </div>
      <div style={panelStyles.body}>
        {/* 基本信息 */}
        <div style={panelStyles.section}>
          <div style={panelStyles.sectionTitle}>基本信息</div>

          <div style={inputStyles.fieldGroup}>
            <label style={inputStyles.label}>名称</label>
            <input
              style={inputStyles.base}
              value={node.name || ''}
              onChange={(e) => {
                // 名称更新暂用 console
                console.log('Update name:', e.target.value);
              }}
            />
          </div>

          <div style={inputStyles.fieldGroup}>
            <label style={inputStyles.label}>类型</label>
            <div
              style={{
                ...inputStyles.base,
                color: colors.textTertiary,
                cursor: 'default',
                textTransform: 'capitalize',
              }}
            >
              {node.type}
            </div>
          </div>
        </div>

        {/* 位置与尺寸 */}
        <div style={panelStyles.section}>
          <div style={panelStyles.sectionTitle}>位置与尺寸</div>

          <div style={{ ...inputStyles.row, marginBottom: spacing.md }}>
            <div style={{ flex: 1 }}>
              <label style={inputStyles.label}>X</label>
              <input
                style={inputStyles.base}
                value={node.layout?.x ?? 0}
                type="number"
                onChange={(e) => console.log('x:', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={inputStyles.label}>Y</label>
              <input
                style={inputStyles.base}
                value={node.layout?.y ?? 0}
                type="number"
                onChange={(e) => console.log('y:', e.target.value)}
              />
            </div>
          </div>

          <div style={{ ...inputStyles.row, marginBottom: spacing.md }}>
            <div style={{ flex: 1 }}>
              <label style={inputStyles.label}>宽度</label>
              <input
                style={inputStyles.base}
                value={nodeStyle.width || 'auto'}
                onChange={(e) => updateStyle('width', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={inputStyles.label}>高度</label>
              <input
                style={inputStyles.base}
                value={nodeStyle.height || 'auto'}
                onChange={(e) => updateStyle('height', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 样式 */}
        <div style={panelStyles.section}>
          <div style={panelStyles.sectionTitle}>样式</div>

          <div style={inputStyles.fieldGroup}>
            <label style={inputStyles.label}>背景色</label>
            <div style={colorFieldStyles.wrapper}>
              <input
                type="color"
                style={colorFieldStyles.colorInput}
                value={nodeStyle.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
              />
              <input
                style={colorFieldStyles.colorText}
                value={nodeStyle.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
              />
            </div>
          </div>

          <div style={inputStyles.fieldGroup}>
            <label style={inputStyles.label}>文字颜色</label>
            <div style={colorFieldStyles.wrapper}>
              <input
                type="color"
                style={colorFieldStyles.colorInput}
                value={nodeStyle.color || '#000000'}
                onChange={(e) => updateStyle('color', e.target.value)}
              />
              <input
                style={colorFieldStyles.colorText}
                value={nodeStyle.color || '#000000'}
                onChange={(e) => updateStyle('color', e.target.value)}
              />
            </div>
          </div>

          <div style={inputStyles.fieldGroup}>
            <label style={inputStyles.label}>字号</label>
            <input
              style={inputStyles.base}
              value={nodeStyle.fontSize || ''}
              placeholder="例: 14px"
              onChange={(e) => updateStyle('fontSize', e.target.value)}
            />
          </div>

          <div style={inputStyles.fieldGroup}>
            <label style={inputStyles.label}>圆角</label>
            <input
              style={inputStyles.base}
              value={nodeStyle.borderRadius || ''}
              placeholder="例: 8px"
              onChange={(e) => updateStyle('borderRadius', e.target.value)}
            />
          </div>

          <div style={inputStyles.fieldGroup}>
            <label style={inputStyles.label}>内边距</label>
            <input
              style={inputStyles.base}
              value={nodeStyle.padding || ''}
              placeholder="例: 16px"
              onChange={(e) => updateStyle('padding', e.target.value)}
            />
          </div>

          <div style={inputStyles.fieldGroup}>
            <label style={inputStyles.label}>文字对齐</label>
            <select
              style={selectStyles.base}
              value={nodeStyle.textAlign || 'left'}
              onChange={(e) => updateStyle('textAlign', e.target.value)}
            >
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
            </select>
          </div>
        </div>

        {/* 文本内容（仅文本类型） */}
        {node.type === BlockType.Text && (
          <div style={panelStyles.section}>
            <div style={panelStyles.sectionTitle}>文本内容</div>
            <div style={inputStyles.fieldGroup}>
              <textarea
                style={{
                  ...inputStyles.base,
                  height: 80,
                  lineHeight: '1.5',
                  padding: `${spacing.md}px`,
                  resize: 'vertical' as const,
                }}
                value={(data.content as string) || ''}
                onChange={(e) => updateData('content', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 图片（仅图片类型） */}
        {node.type === BlockType.Image && (
          <div style={panelStyles.section}>
            <div style={panelStyles.sectionTitle}>图片</div>
            <div style={inputStyles.fieldGroup}>
              <label style={inputStyles.label}>图片地址</label>
              <input
                style={inputStyles.base}
                value={(data.src as string) || ''}
                placeholder="https://..."
                onChange={(e) => updateData('src', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 按钮（仅按钮类型） */}
        {node.type === BlockType.Button && (
          <div style={panelStyles.section}>
            <div style={panelStyles.sectionTitle}>按钮</div>
            <div style={inputStyles.fieldGroup}>
              <label style={inputStyles.label}>按钮文字</label>
              <input
                style={inputStyles.base}
                value={(data.content as string) || ''}
                onChange={(e) => updateData('content', e.target.value)}
              />
            </div>
            <div style={inputStyles.fieldGroup}>
              <label style={inputStyles.label}>变体</label>
              <select
                style={selectStyles.base}
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
  );
};

export { PropertyPanel };
