import React, { useCallback, useMemo } from 'react';
import type { ButtonBlockNode } from '@block-canvas/core';

// ---- Props ----

export interface ButtonBlockProps {
  node: ButtonBlockNode;
  isEditing?: boolean;
}

// ---- Variant 样式映射 ----

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: '#1677ff',
    color: '#ffffff',
    border: '1px solid #1677ff',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: '#333333',
    border: '1px solid #d9d9d9',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#333333',
    border: '1px solid transparent',
  },
};

// ---- Component ----

export const ButtonBlock: React.FC<ButtonBlockProps> = ({
  node,
  isEditing = false,
}) => {
  const { props, style } = node;

  const buttonStyle = useMemo<React.CSSProperties>(() => {
    const variant = props.variant ?? 'primary';
    const base: React.CSSProperties = {
      padding: '4px 15px',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '22px',
      borderRadius: 6,
      cursor: isEditing ? 'default' : 'pointer',
      textAlign: 'center',
      boxSizing: 'border-box',
      userSelect: 'none',
      transition: 'all 0.2s',
      ...variantStyles[variant],
    };

    // 继承节点样式（覆盖默认值）
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
  }, [props, style, isEditing]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isEditing) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (props.href) {
        // href 链接
        window.open(props.href, '_blank', 'noopener,noreferrer');
      }
      // onClick 回调由外部处理（如通过 commandManager）
    },
    [isEditing, props.href],
  );

  return (
    <button style={buttonStyle} onClick={handleClick} type="button">
      {props.label}
    </button>
  );
};
