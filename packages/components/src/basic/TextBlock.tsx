import React, { useMemo } from 'react';
import type { TextBlockNode } from '@block-canvas/core';

// ---- Props ----

export interface TextBlockProps {
  node: TextBlockNode;
}

// ---- Component ----

export const TextBlock: React.FC<TextBlockProps> = ({ node }) => {
  const { props, style } = node;

  const textStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {};

    if (props.fontSize) s.fontSize = props.fontSize;
    if (props.fontWeight) s.fontWeight = props.fontWeight;
    if (props.color) s.color = props.color;
    if (props.textAlign) s.textAlign = props.textAlign;
    if (props.lineHeight) s.lineHeight = props.lineHeight;
    if (props.fontFamily) s.fontFamily = props.fontFamily;

    // 合并节点 style 中的样式（节点 style 优先级较低，props 优先级较高）
    if (style.color && !props.color) s.color = style.color;
    if (style.fontSize && !props.fontSize) s.fontSize = style.fontSize;
    if (style.fontWeight && !props.fontWeight) s.fontWeight = style.fontWeight;
    if (style.textAlign && !props.textAlign) s.textAlign = style.textAlign;
    if (style.lineHeight && !props.lineHeight) s.lineHeight = style.lineHeight;
    if (style.fontFamily && !props.fontFamily) s.fontFamily = style.fontFamily;

    // 继承其他通用样式
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
  }, [props, style]);

  return <div style={textStyle}>{props.content}</div>;
};
