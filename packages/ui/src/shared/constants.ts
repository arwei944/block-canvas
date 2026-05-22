import { BlockType } from '@block-canvas/core';

export const TYPE_ICON_COLORS: Record<string, string> = {
  [BlockType.Text]: 'bg-blue-500',
  [BlockType.Image]: 'bg-purple-500',
  [BlockType.Button]: 'bg-green-500',
  [BlockType.Container]: 'bg-amber-500',
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  success: 'bg-green-500',
  pending: 'bg-purple-500',
  error: 'bg-red-500',
};
