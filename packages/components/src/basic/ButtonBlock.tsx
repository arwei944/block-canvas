import React, { useCallback, useMemo } from 'react';
import type { ButtonBlockNode } from '@block-canvas/core';
import { useTheme } from '@block-canvas/theme';

export interface ButtonBlockProps {
  node: ButtonBlockNode;
  isEditing?: boolean;
}

export const ButtonBlock: React.FC<ButtonBlockProps> = ({
  node,
  isEditing = false,
}) => {
  const { props, style } = node;
  const theme = useTheme();

  const buttonStyle = useMemo<React.CSSProperties>(() => {
    const variant = props.variant ?? 'primary';
    
    // 从主题获取按钮配置
    const buttonConfig = theme.components?.button || {};
    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.primary,
        color: theme.colors.textOnPrimary,
        border: 'none',
        ...buttonConfig.primary,
      },
      secondary: {
        backgroundColor: 'transparent',
        color: theme.colors.primary,
        border: `1px solid ${theme.colors.border}`,
        ...buttonConfig.secondary,
      },
      ghost: {
        backgroundColor: 'transparent',
        color: theme.colors.textSecondary,
        border: 'none',
        ...buttonConfig.ghost,
      },
    };

    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: buttonConfig.padding || '6px 16px',
      height: buttonConfig.height || 36,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      lineHeight: 1.4,
      borderRadius: theme.radius.sm,
      cursor: isEditing ? 'default' : 'pointer',
      textAlign: 'center',
      boxSizing: 'border-box',
      userSelect: 'none',
      transition: `all ${theme.transitions.fast}`,
      ...variantStyles[variant],
    };

    // style 覆盖
    if (style.width) base.width = style.width;
    if (style.height) base.height = style.height;
    if (style.padding) base.padding = style.padding;
    if (style.margin) base.margin = style.margin;
    if (style.borderRadius) base.borderRadius = style.borderRadius;
    if (style.border) base.border = style.border;
    if (style.backgroundColor) base.backgroundColor = style.backgroundColor;
    if (style.color) base.color = style.color;
    if (style.fontSize) base.fontSize = style.fontSize;
    if (style.fontWeight) base.fontWeight = style.fontWeight;
    if (style.fontFamily) base.fontFamily = style.fontFamily;
    if (style.opacity !== undefined) base.opacity = style.opacity;
    if (style.zIndex !== undefined) base.zIndex = style.zIndex;
    if (style.boxShadow) base.boxShadow = style.boxShadow;
    if (style.transition) base.transition = style.transition;
    if (style.transform) base.transform = style.transform;

    return base;
  }, [props, style, isEditing, theme]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isEditing) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (props.href) {
        window.open(props.href, '_blank', 'noopener,noreferrer');
      }
    },
    [isEditing, props.href],
  );

  return (
    <button style={buttonStyle} onClick={handleClick} type="button">
      {props.label}
    </button>
  );
};
