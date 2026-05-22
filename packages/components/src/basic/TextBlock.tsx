import React, { useMemo } from 'react';
import type { TextBlockNode } from '@block-canvas/core';
import { useTheme } from '@block-canvas/theme';

export interface TextBlockProps {
  node: TextBlockNode;
}

export const TextBlock: React.FC<TextBlockProps> = ({ node }) => {
  const { props, style } = node;
  const theme = useTheme();

  const textStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      // 默认使用主题字体
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textPrimary,
      lineHeight: theme.typography.lineHeight.normal,
    };

    // props 覆盖（优先级最高）
    if (props.fontSize) s.fontSize = props.fontSize;
    if (props.fontWeight) s.fontWeight = props.fontWeight;
    if (props.color) s.color = props.color;
    if (props.textAlign) s.textAlign = props.textAlign;
    if (props.lineHeight) s.lineHeight = props.lineHeight;
    if (props.fontFamily) s.fontFamily = props.fontFamily;

    // style 覆盖（优先级次之）
    if (style.color && !props.color) s.color = style.color;
    if (style.fontSize && !props.fontSize) s.fontSize = style.fontSize;
    if (style.fontWeight && !props.fontWeight) s.fontWeight = style.fontWeight;
    if (style.textAlign && !props.textAlign) s.textAlign = style.textAlign;
    if (style.lineHeight && !props.lineHeight) s.lineHeight = style.lineHeight;
    if (style.fontFamily && !props.fontFamily) s.fontFamily = style.fontFamily;

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
    if (style.boxShadow) s.boxShadow = style.boxShadow;
    if (style.cursor) s.cursor = style.cursor;
    if (style.transition) s.transition = style.transition;
    if (style.transform) s.transform = style.transform;

    return s;
  }, [props, style, theme]);

  return <div style={textStyle}>{props.content}</div>;
};
