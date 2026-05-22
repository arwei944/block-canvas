import React, { useMemo } from 'react';
import type { BlockNode } from '@block-canvas/core';
import { useTheme } from '@block-canvas/theme';

export interface TableBlockProps {
  node: BlockNode;
}

export const TableBlock: React.FC<TableBlockProps> = ({ node }) => {
  const { style, data } = node;
  const theme = useTheme();

  const columns = (data?.columns as string[]) ?? [];
  const rows = (data?.rows as string[][]) ?? [];

  const tableConfig = theme.components?.table || {};

  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      boxSizing: 'border-box',
      overflow: 'auto',
      borderRadius: theme.radius.md,
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

    return s;
  }, [style, theme]);

  const tableStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textPrimary,
    };

    if (style.fontSize) s.fontSize = style.fontSize;
    if (style.fontFamily) s.fontFamily = style.fontFamily;
    if (style.color) s.color = style.color;

    return s;
  }, [style, theme]);

  const cellStyle: React.CSSProperties = {
    border: `1px solid ${tableConfig.borderColor || theme.colors.divider}`,
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    textAlign: 'left',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    backgroundColor: tableConfig.headerBg || theme.colors.background,
    fontWeight: theme.typography.fontWeight.semibold,
  };

  return (
    <div style={wrapperStyle}>
      <table style={tableStyle}>
        {columns.length > 0 && (
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} style={headerCellStyle}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={cellStyle}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
