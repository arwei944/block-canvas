import React, { useMemo } from 'react';
import type { BlockNode } from '@block-canvas/core';

// ---- Props ----

export interface InputBlockProps {
  node: BlockNode;
}

// ---- Component ----

export const InputBlock: React.FC<InputBlockProps> = ({ node }) => {
  const { style, data } = node;

  const label = (data?.label as string) ?? '';
  const placeholder = (data?.placeholder as string) ?? '';
  const inputType = (data?.inputType as string) ?? 'text';
  const required = (data?.required as boolean) ?? false;

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

  const inputStyle = useMemo<React.CSSProperties>(() => {
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
      {label && <label style={labelStyle}>{label}{required && <span style={{ color: '#ff4d4f' }}>*</span>}</label>}
      <input
        type={inputType}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </div>
  );
};
