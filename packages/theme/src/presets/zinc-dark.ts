/**
 * Zinc Dark 主题
 * 当前的默认暗色主题，保持向后兼容
 */

import type { BlockCanvasTheme } from '../types';

export const zincDarkTheme: BlockCanvasTheme = {
  name: 'zinc-dark',
  mode: 'dark',

  colors: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    background: '#18181b',
    surface: '#27272a',
    surfaceHover: '#3f3f46',
    surfaceSelected: '#3b82f6',

    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    textTertiary: '#71717a',
    textOnPrimary: '#ffffff',

    border: '#3f3f46',
    borderLight: '#27272a',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowHeavy: 'rgba(0, 0, 0, 0.5)',
    divider: '#27272a',

    disabledBg: '#27272a',
    disabledText: '#52525b',
  },

  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    full: 9999,
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  },

  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: {
      xs: 11,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  },

  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },

  components: {
    button: {
      height: 32,
      padding: '0 16px',
      primary: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
      secondary: {
        backgroundColor: 'transparent',
        color: '#f4f4f5',
        border: '1px solid #3f3f46',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#a1a1aa',
      },
    },
    input: {
      height: 32,
      padding: '0 12px',
      base: {
        backgroundColor: '#27272a',
        border: '1px solid #3f3f46',
        color: '#f4f4f5',
      },
      focus: {
        borderColor: '#3b82f6',
      },
    },
  },
};

export default zincDarkTheme;
