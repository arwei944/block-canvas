import React, { useCallback, useMemo } from 'react';
import { useEditor } from '@block-canvas/react';
import { useEditorStore, BlockType, type BlockNode } from '@block-canvas/core';
import { useTheme } from '@block-canvas/theme';
import { Square } from 'lucide-react';

export interface PropertyPanelProps {
  className?: string;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ className = '' }) => {
  const { document, selection } = useEditor();
  const theme = useTheme();
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
    headerSubtitle: {
      fontSize: 11,
      fontWeight: 400,
      color: theme.colors.textTertiary,
    },
    content: {
      flex: 1,
      overflow: 'auto',
      padding: 12,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      marginBottom: 8,
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      color: theme.colors.textTertiary,
    },
    label: {
      marginBottom: 4,
      display: 'block',
      fontSize: 12,
      fontWeight: 500,
      color: theme.colors.textSecondary,
    },
    input: {
      height: 30,
      width: '100%',
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surfaceHover,
      padding: '0 8px',
      fontSize: 13,
      color: theme.colors.textPrimary,
      outline: 'none',
      transition: `border-color ${theme.transitions.fast}`,
    },
    select: {
      height: 30,
      width: '100%',
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surfaceHover,
      padding: '0 8px',
      fontSize: 13,
      color: theme.colors.textPrimary,
      outline: 'none',
      appearance: 'none' as const,
      cursor: 'pointer',
    },
    textarea: {
      height: 80,
      width: '100%',
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surfaceHover,
      padding: 8,
      fontSize: 13,
      lineHeight: 1.5,
      color: theme.colors.textPrimary,
      outline: 'none',
      resize: 'vertical' as const,
    },
    row: {
      display: 'flex',
      gap: 8,
      marginBottom: 12,
    },
    col: {
      flex: 1,
    },
    colorRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    colorInput: {
      height: 30,
      width: 30,
      cursor: 'pointer',
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: 'transparent',
      padding: 2,
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

  const inputFocusStyle = {
    borderColor: theme.colors.primary,
  };

  if (!node) {
    return (
      <div style={styles.container} className={className}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>属性</span>
        </div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <div style={styles.emptyState}>
            <Square size={20} style={{ marginBottom: 4, opacity: 0.3 }} />
            <span style={{ fontSize: 12 }}>选择一个节点以编辑属性</span>
          </div>
        </div>
      </div>
    );
  }

  const nodeStyle = node.style || {};
  const data = node.data || {};

  return (
    <div style={styles.container} className={className}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>属性</span>
        <span style={styles.headerSubtitle}>{node.name || node.type}</span>
      </div>
      <div style={styles.content}>
        <div style={{ marginBottom: 16 }}>
          {/* Basic Info */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>基本信息</div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>名称</label>
              <input
                style={styles.input}
                value={node.name || ''}
                onChange={(e) => console.log('Update name:', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>类型</label>
              <div style={{
                ...styles.input,
                color: theme.colors.textTertiary,
                cursor: 'default',
              }}>
                {node.type}
              </div>
            </div>
          </div>

          {/* Position & Size */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>位置与尺寸</div>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>X</label>
                <input
                  style={styles.input}
                  value={node.layout?.left ?? 0}
                  type="number"
                  onChange={(e) => console.log('x:', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Y</label>
                <input
                  style={styles.input}
                  value={node.layout?.top ?? 0}
                  type="number"
                  onChange={(e) => console.log('y:', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>宽度</label>
                <input
                  style={styles.input}
                  value={nodeStyle.width || 'auto'}
                  onChange={(e) => updateStyle('width', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>高度</label>
                <input
                  style={styles.input}
                  value={nodeStyle.height || 'auto'}
                  onChange={(e) => updateStyle('height', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>
            </div>
          </div>

          {/* Styles */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>样式</div>

            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>背景色</label>
              <div style={styles.colorRow}>
                <input
                  type="color"
                  style={styles.colorInput}
                  value={nodeStyle.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                />
                <input
                  style={{ ...styles.input, flex: 1, fontFamily: 'monospace' }}
                  value={nodeStyle.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>文字颜色</label>
              <div style={styles.colorRow}>
                <input
                  type="color"
                  style={styles.colorInput}
                  value={nodeStyle.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                />
                <input
                  style={{ ...styles.input, flex: 1, fontFamily: 'monospace' }}
                  value={nodeStyle.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>字号</label>
              <input
                style={styles.input}
                value={nodeStyle.fontSize || ''}
                placeholder="例: 14px"
                onChange={(e) => updateStyle('fontSize', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>圆角</label>
              <input
                style={styles.input}
                value={nodeStyle.borderRadius || ''}
                placeholder="例: 8px"
                onChange={(e) => updateStyle('borderRadius', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>内边距</label>
              <input
                style={styles.input}
                value={nodeStyle.padding || ''}
                placeholder="例: 16px"
                onChange={(e) => updateStyle('padding', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>文字对齐</label>
              <select
                style={styles.select}
                value={nodeStyle.textAlign || 'left'}
                onChange={(e) => updateStyle('textAlign', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              >
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </div>
          </div>

          {/* Text content (text type only) */}
          {node.type === BlockType.Text && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>文本内容</div>
              <div style={{ marginBottom: 12 }}>
                <textarea
                  style={styles.textarea}
                  value={(data.content as string) || ''}
                  onChange={(e) => updateData('content', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>
            </div>
          )}

          {/* Image (image type only) */}
          {node.type === BlockType.Image && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>图片</div>
              <div style={{ marginBottom: 12 }}>
                <label style={styles.label}>图片地址</label>
                <input
                  style={styles.input}
                  value={(data.src as string) || ''}
                  placeholder="https://..."
                  onChange={(e) => updateData('src', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>
            </div>
          )}

          {/* Button (button type only) */}
          {node.type === BlockType.Button && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>按钮</div>
              <div style={{ marginBottom: 12 }}>
                <label style={styles.label}>按钮文字</label>
                <input
                  style={styles.input}
                  value={(data.content as string) || ''}
                  onChange={(e) => updateData('content', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={styles.label}>变体</label>
                <select
                  style={styles.select}
                  value={(node.props.variant as string) || 'primary'}
                  onChange={(e) => console.log('variant:', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
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
