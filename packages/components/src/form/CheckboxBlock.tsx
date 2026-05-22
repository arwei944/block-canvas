import React, { useMemo } from 'react';
import type { BlockNode } from '@block-canvas/core';
import { useTheme } from '@block-canvas/theme';

export interface CheckboxBlockProps {
  node: BlockNode;
}

export const CheckboxBlock: React.FC<CheckboxBlockProps> = ({ node }) => {
  const { style, data } = node;
  const theme = useTheme();

  const label = (data?.label as string) ?? '';
  const checked = (data?.checked as boolean) ?? false;

  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
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
  }, [style, theme]);

  const labelStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textPrimary,
      lineHeight: theme.typography.lineHeight.normal,
    };

    if (style.fontSize) s.fontSize = style.fontSize;
    if (style.fontWeight) s.fontWeight = style.fontWeight;
    if (style.color) s.color = style.color;
    if (style.fontFamily) s.fontFamily = style.fontFamily;

    return s;
  }, [style, theme]);

  const checkboxStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: 16,
      height: 16,
      accentColor: theme.colors.primary,
    };
  }, [theme]);

  return (
    <label style={wrapperStyle}>
      <input type="checkbox" defaultChecked={checked} style={checkboxStyle} />
      {label && <span style={labelStyle}>{label}</span>}
    </label>
  );
};
