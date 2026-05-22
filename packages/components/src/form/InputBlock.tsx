import React, { useMemo } from 'react';
import type { BlockNode } from '@block-canvas/core';
import { useTheme } from '@block-canvas/theme';

export interface InputBlockProps {
  node: BlockNode;
}

export const InputBlock: React.FC<InputBlockProps> = ({ node }) => {
  const { style, data } = node;
  const theme = useTheme();

  const label = (data?.label as string) ?? '';
  const placeholder = (data?.placeholder as string) ?? '';
  const inputType = (data?.inputType as string) ?? 'text';
  const required = (data?.required as boolean) ?? false;

  const inputConfig = theme.components?.input || {};

  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.xs,
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
  }, [style, theme]);

  const labelStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.textSecondary,
    };

    if (style.fontSize) s.fontSize = style.fontSize;
    if (style.fontWeight) s.fontWeight = style.fontWeight;
    if (style.color) s.color = style.color;
    if (style.fontFamily) s.fontFamily = style.fontFamily;

    return s;
  }, [style, theme]);

  const inputStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      width: '100%',
      height: inputConfig.height || 36,
      padding: inputConfig.padding || '0 12px',
      fontSize: theme.typography.fontSize.base,
      lineHeight: theme.typography.lineHeight.normal,
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.colors.border}`,
      outline: 'none',
      transition: `border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}`,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surface,
      boxSizing: 'border-box',
      ...inputConfig.base,
    };

    if (style.fontSize) s.fontSize = style.fontSize;
    if (style.fontFamily) s.fontFamily = style.fontFamily;
    if (style.borderRadius) s.borderRadius = style.borderRadius;
    if (style.border) s.border = style.border;
    if (style.color) s.color = style.color;

    return s;
  }, [style, theme, inputConfig]);

  return (
    <div style={wrapperStyle}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={{ color: theme.colors.error }}> *</span>}
        </label>
      )}
      <input
        type={inputType}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </div>
  );
};
