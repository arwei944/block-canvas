import React, { useMemo } from 'react';
import type { ContainerBlockNode } from '@block-canvas/core';
import { NodeElement } from '@block-canvas/react';
import { useTheme } from '@block-canvas/theme';

export interface ContainerBlockProps {
  node: ContainerBlockNode;
}

export const ContainerBlock: React.FC<ContainerBlockProps> = ({ node }) => {
  const { props, style, layout } = node;
  const theme = useTheme();

  const containerStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      gap: layout.gap !== undefined ? layout.gap : theme.spacing.sm,
    };

    // layout 属性
    if (layout.position) s.position = layout.position;
    if (layout.top !== undefined) s.top = layout.top;
    if (layout.left !== undefined) s.left = layout.left;
    if (layout.flexDirection) s.flexDirection = layout.flexDirection;
    if (layout.alignItems) s.alignItems = layout.alignItems;
    if (layout.justifyContent) s.justifyContent = layout.justifyContent;
    if (layout.flexGrow !== undefined) s.flexGrow = layout.flexGrow;
    if (layout.flexShrink !== undefined) s.flexShrink = layout.flexShrink;
    if (layout.flexBasis) s.flexBasis = layout.flexBasis;
    if (layout.gap !== undefined) s.gap = layout.gap;

    // style 属性（优先级高于 layout）
    if (style.display) s.display = style.display;
    if (style.flexDirection) s.flexDirection = style.flexDirection;
    if (style.alignItems) s.alignItems = style.alignItems;
    if (style.justifyContent) s.justifyContent = style.justifyContent;
    if (style.gap !== undefined) s.gap = style.gap;

    // 通用样式
    if (style.width) s.width = style.width;
    if (style.height) s.height = style.height;
    if (style.padding) s.padding = style.padding;
    if (style.margin) s.margin = style.margin;
    if (style.backgroundColor) s.backgroundColor = style.backgroundColor;
    if (style.borderRadius) s.borderRadius = style.borderRadius;
    if (style.border) s.border = style.border;
    if (style.opacity !== undefined) s.opacity = style.opacity;
    if (style.zIndex !== undefined) s.zIndex = style.zIndex;
    if (style.overflow) s.overflow = style.overflow;
    if (style.position) s.position = style.position;
    if (style.top !== undefined) s.top = style.top;
    if (style.left !== undefined) s.left = style.left;
    if (style.right !== undefined) s.right = style.right;
    if (style.bottom !== undefined) s.bottom = style.bottom;
    if (style.boxShadow) s.boxShadow = style.boxShadow;
    if (style.cursor) s.cursor = style.cursor;
    if (style.transition) s.transition = style.transition;
    if (style.transform) s.transform = style.transform;

    return s;
  }, [props, style, layout, theme]);

  return (
    <div style={containerStyle}>
      {props.children.map((childId) => (
        <NodeElement key={childId} nodeId={childId} />
      ))}
    </div>
  );
};
