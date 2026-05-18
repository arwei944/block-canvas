import React, { useMemo } from 'react';
import type { BlockNode } from '@block-canvas/core';

// ---- Props ----

export interface SelectBlockProps {
  node: BlockNode;
}

// ---- Component ----

export const SelectBlock: React.FC<SelectBlockProps> = ({ node }) => {
  const { style, data } = node;

  const label = (data?.label as string) ?? '';
  const placeholder = (data?.placeholder as string) ?? '请选择...';
  const options = (data?.options as Array<{ label: string; value: string }>) ?? [];

  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      boxSizing: 'border-box',
    };

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

    return s;
  }, [style]);

  const labelStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      fontSize: 14,
      fontWeight: 500,
      color: '#333',
    };

    if (style.fontSize) s.fontSize = style.fontSize;
    if (style.fontWeight) s.fontWeight = style.fontWeight;
    if (style.color) s.color = style.color;
    if (style.fontFamily) s.fontFamily = style.fontFamily;

    return s;
  }, [style]);

  const selectStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      padding: '4px 11px',
      fontSize: 14,
      lineHeight: '22px',
      borderRadius: 6,
      border: '1px solid #d9d9d9',
      outline: 'none',
      transition: 'border-color 0.2s',
      color: '#333',
      backgroundColor: '#fff',
      cursor: 'pointer',
    };

    if (style.fontSize) s.fontSize = style.fontSize;
    if (style.fontFamily) s.fontFamily = style.fontFamily;
    if (style.borderRadius) s.borderRadius = style.borderRadius;
    if (style.border) s.border = style.border;
    if (style.color) s.color = style.color;

    return s;
  }, [style]);

  return (
    <div style={wrapperStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <select style={selectStyle}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
