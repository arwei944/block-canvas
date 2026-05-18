import React, { useMemo } from 'react';
import type { BlockNode } from '@block-canvas/core';

// ---- Props ----

export interface CheckboxBlockProps {
  node: BlockNode;
}

// ---- Component ----

export const CheckboxBlock: React.FC<CheckboxBlockProps> = ({ node }) => {
  const { style, data } = node;

  const label = (data?.label as string) ?? '';
  const checked = (data?.checked as boolean) ?? false;

  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      boxSizing: 'border-box',
      userSelect: 'none',
    };

    if (style.padding) s.padding = style.padding;
    if (style.margin) s.margin = style.margin;
    if (style.backgroundColor) s.backgroundColor = style.backgroundColor;
    if (style.borderRadius) s.borderRadius = style.borderRadius;
    if (style.border) s.border = style.border;
    if (style.opacity !== undefined) s.opacity = style.opacity;
    if (style.zIndex !== undefined) s.zIndex = style.zIndex;
    if (style.overflow) s.overflow = style.overflow;
    if (style.cursor) s.cursor = style.cursor;

    return s;
  }, [style]);

  const labelStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      fontSize: 14,
      color: '#333',
      lineHeight: '22px',
    };

    if (style.fontSize) s.fontSize = style.fontSize;
    if (style.fontWeight) s.fontWeight = style.fontWeight;
    if (style.color) s.color = style.color;
    if (style.fontFamily) s.fontFamily = style.fontFamily;

    return s;
  }, [style]);

  return (
    <label style={wrapperStyle}>
      <input type="checkbox" defaultChecked={checked} />
      {label && <span style={labelStyle}>{label}</span>}
    </label>
  );
};
