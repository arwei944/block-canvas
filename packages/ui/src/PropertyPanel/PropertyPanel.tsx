import React, { useCallback } from 'react';
import { useEditor } from '@block-canvas/react';
import { BlockType } from '@block-canvas/core';
import type {
  BlockId,
  BlockNode,
  TextBlockNode,
  ImageBlockNode,
  ButtonBlockNode,
  ContainerBlockNode,
} from '@block-canvas/core';
import { panelStyles, inputStyles } from '../shared/styles';
import { TextField, NumberField, ColorField, SelectField } from './fields';

export interface PropertyPanelProps {
  style?: React.CSSProperties;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ style }) => {
  const { document, selection, updateNode, updateNodeStyle, updateNodeLayout } = useEditor();

  const selectedId: BlockId | undefined = selection.selectedIds[0];
  const selectedNode: BlockNode | undefined = selectedId
    ? document?.nodes[selectedId]
    : undefined;

  const handleUpdateName = useCallback(
    (name: string) => {
      if (!selectedId) return;
      updateNode(selectedId, { name });
    },
    [selectedId, updateNode],
  );

  const handleUpdateStyle = useCallback(
    (styleUpdate: Record<string, unknown>) => {
      if (!selectedId) return;
      updateNodeStyle(selectedId, styleUpdate);
    },
    [selectedId, updateNodeStyle],
  );

  const handleUpdateLayout = useCallback(
    (layoutUpdate: Record<string, unknown>) => {
      if (!selectedId) return;
      updateNodeLayout(selectedId, layoutUpdate);
    },
    [selectedId, updateNodeLayout],
  );

  const handleUpdateProps = useCallback(
    (propsUpdate: Record<string, unknown>) => {
      if (!selectedId || !selectedNode) return;
      updateNode(selectedId, {
        props: { ...selectedNode.props, ...propsUpdate },
      } as Partial<BlockNode>);
    },
    [selectedId, selectedNode, updateNode],
  );

  if (!document) {
    return (
      <div style={{ ...panelStyles.container, ...style }}>
        <div style={panelStyles.header}>属性</div>
        <div style={panelStyles.emptyState}>未加载文档</div>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div style={{ ...panelStyles.container, ...style }}>
        <div style={panelStyles.header}>属性</div>
        <div style={panelStyles.emptyState}>
          {'\u{1F446}'} 请选择一个组件
        </div>
      </div>
    );
  }

  const nodeStyle = selectedNode.style;
  const nodeLayout = selectedNode.layout;

  return (
    <div style={{ ...panelStyles.container, ...style }}>
      <div style={panelStyles.header}>属性</div>
      <div style={panelStyles.body}>
        {/* 基本信息 */}
        <div style={panelStyles.section}>
          <div style={panelStyles.sectionTitle}>基本信息</div>
          <TextField
            label="名称"
            value={selectedNode.name}
            onChange={handleUpdateName}
          />
          <TextField
            label="类型"
            value={selectedNode.type}
            onChange={() => {}}
            disabled
          />
        </div>

        {/* 位置和尺寸 */}
        <div style={panelStyles.section}>
          <div style={panelStyles.sectionTitle}>位置与尺寸</div>
          <div style={inputStyles.row}>
            <NumberField
              label="X"
              value={nodeLayout.left}
              onChange={(v) => handleUpdateLayout({ left: v })}
              style={{ flex: 1 }}
            />
            <NumberField
              label="Y"
              value={nodeLayout.top}
              onChange={(v) => handleUpdateLayout({ top: v })}
              style={{ flex: 1 }}
            />
          </div>
          <div style={inputStyles.row}>
            <NumberField
              label="宽度"
              value={nodeStyle.width ? parseFloat(nodeStyle.width) : undefined}
              onChange={(v) => handleUpdateStyle({ width: `${v}px` })}
              min={0}
              style={{ flex: 1 }}
            />
            <NumberField
              label="高度"
              value={nodeStyle.height ? parseFloat(nodeStyle.height) : undefined}
              onChange={(v) => handleUpdateStyle({ height: `${v}px` })}
              min={0}
              style={{ flex: 1 }}
            />
          </div>
        </div>

        {/* 根据类型显示不同属性 */}
        {selectedNode.type === BlockType.Text && renderTextProps(selectedNode, handleUpdateProps)}
        {selectedNode.type === BlockType.Image && renderImageProps(selectedNode, handleUpdateProps)}
        {selectedNode.type === BlockType.Button && renderButtonProps(selectedNode, handleUpdateProps)}
        {selectedNode.type === BlockType.Container && renderContainerProps(selectedNode, handleUpdateLayout)}

        {/* 通用样式 */}
        <div style={panelStyles.section}>
          <div style={panelStyles.sectionTitle}>样式</div>
          <ColorField
            label="背景颜色"
            value={nodeStyle.backgroundColor || ''}
            onChange={(v) => handleUpdateStyle({ backgroundColor: v })}
          />
          <NumberField
            label="圆角"
            value={nodeStyle.borderRadius ? parseInt(nodeStyle.borderRadius, 10) : undefined}
            onChange={(v) => handleUpdateStyle({ borderRadius: `${v}px` })}
            min={0}
          />
          <NumberField
            label="透明度"
            value={nodeStyle.opacity}
            onChange={(v) => handleUpdateStyle({ opacity: v })}
            min={0}
            max={1}
            step={0.1}
          />
        </div>
      </div>
    </div>
  );
};

// ---- 各类型属性渲染函数 ----

function renderTextProps(
  node: TextBlockNode,
  onUpdateProps: (props: Record<string, unknown>) => void,
) {
  return (
    <div style={panelStyles.section}>
      <div style={panelStyles.sectionTitle}>文本</div>
      <TextField
        label="内容"
        value={node.props.content}
        onChange={(v) => onUpdateProps({ content: v })}
      />
      <NumberField
        label="字号"
        value={node.props.fontSize ? parseInt(node.props.fontSize, 10) : undefined}
        onChange={(v) => onUpdateProps({ fontSize: `${v}px` })}
        min={1}
      />
      <SelectField
        label="字重"
        value={String(node.props.fontWeight || 'normal')}
        onChange={(v) => onUpdateProps({ fontWeight: v })}
        options={[
          { value: 'normal', label: '常规' },
          { value: 'bold', label: '粗体' },
          { value: '100', label: '100 (极细)' },
          { value: '300', label: '300 (细体)' },
          { value: '500', label: '500 (中等)' },
          { value: '700', label: '700 (粗体)' },
          { value: '900', label: '900 (黑体)' },
        ]}
      />
      <ColorField
        label="颜色"
        value={node.props.color || ''}
        onChange={(v) => onUpdateProps({ color: v })}
      />
      <SelectField
        label="文本对齐"
        value={node.props.textAlign || 'left'}
        onChange={(v) => onUpdateProps({ textAlign: v })}
        options={[
          { value: 'left', label: '左对齐' },
          { value: 'center', label: '居中' },
          { value: 'right', label: '右对齐' },
        ]}
      />
    </div>
  );
}

function renderImageProps(
  node: ImageBlockNode,
  onUpdateProps: (props: Record<string, unknown>) => void,
) {
  return (
    <div style={panelStyles.section}>
      <div style={panelStyles.sectionTitle}>图片</div>
      <TextField
        label="图片地址"
        value={node.props.src}
        onChange={(v) => onUpdateProps({ src: v })}
        placeholder="https://..."
      />
      <TextField
        label="替代文本"
        value={node.props.alt || ''}
        onChange={(v) => onUpdateProps({ alt: v })}
      />
      <SelectField
        label="填充模式"
        value={node.props.objectFit || 'cover'}
        onChange={(v) => onUpdateProps({ objectFit: v })}
        options={[
          { value: 'cover', label: '覆盖' },
          { value: 'contain', label: '包含' },
          { value: 'fill', label: '填充' },
          { value: 'none', label: '无' },
        ]}
      />
    </div>
  );
}

function renderButtonProps(
  node: ButtonBlockNode,
  onUpdateProps: (props: Record<string, unknown>) => void,
) {
  return (
    <div style={panelStyles.section}>
      <div style={panelStyles.sectionTitle}>按钮</div>
      <TextField
        label="标签文字"
        value={node.props.label}
        onChange={(v) => onUpdateProps({ label: v })}
      />
      <SelectField
        label="样式变体"
        value={node.props.variant || 'primary'}
        onChange={(v) => onUpdateProps({ variant: v })}
        options={[
          { value: 'primary', label: '主要' },
          { value: 'secondary', label: '次要' },
          { value: 'ghost', label: '透明' },
        ]}
      />
      <TextField
        label="链接 (href)"
        value={node.props.href || ''}
        onChange={(v) => onUpdateProps({ href: v })}
        placeholder="https://..."
      />
    </div>
  );
}

function renderContainerProps(
  _node: ContainerBlockNode,
  onUpdateLayout: (layout: Record<string, unknown>) => void,
) {
  return (
    <div style={panelStyles.section}>
      <div style={panelStyles.sectionTitle}>容器</div>
      <SelectField
        label="弹性方向"
        value={_node.layout.flexDirection || 'column'}
        onChange={(v) => onUpdateLayout({ flexDirection: v })}
        options={[
          { value: 'row', label: '水平排列' },
          { value: 'column', label: '垂直排列' },
          { value: 'row-reverse', label: '水平反向' },
          { value: 'column-reverse', label: '垂直反向' },
        ]}
      />
      <NumberField
        label="间距"
        value={_node.layout.gap}
        onChange={(v) => onUpdateLayout({ gap: v })}
        min={0}
      />
      <NumberField
        label="内边距"
        value={_node.style.padding ? parseInt(_node.style.padding, 10) : undefined}
        onChange={(v) => onUpdateLayout({})}
        min={0}
      />
    </div>
  );
}
