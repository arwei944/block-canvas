import React, { useMemo } from 'react';
import type { ImageBlockNode } from '@block-canvas/core';

// ---- Props ----

export interface ImageBlockProps {
  node: ImageBlockNode;
}

// ---- Component ----

export const ImageBlock: React.FC<ImageBlockProps> = ({ node }) => {
  const { props, style } = node;

  const imageStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      display: 'block',
      maxWidth: '100%',
    };

    if (props.objectFit) s.objectFit = props.objectFit;
    if (style.objectFit && !props.objectFit) s.objectFit = style.objectFit;

    // 继承通用样式
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

  return (
    <img
      src={props.src}
      alt={props.alt ?? ''}
      style={imageStyle}
      draggable={false}
    />
  );
};
