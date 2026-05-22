/**
 * macOS Light 主题
 * macOS 极简浅色风格
 */

import type { BlockCanvasTheme } from '../types';

export const macLightTheme: BlockCanvasTheme = {
  name: 'mac-light',
  mode: 'light',

  colors: {
    // 主色 - 苹果蓝
    primary: '#007aff',
    primaryHover: '#0066d6',
    
    // 语义色
    success: '#34c759',
    warning: '#ff9f0a',
    error: '#ff3b30',
    info: '#007aff',

    // 背景色
    background: '#f5f5f7',
    surface: '#ffffff',
    surfaceHover: '#e8e8ed',
    surfaceSelected: 'rgba(0, 122, 255, 0.1)',

    // 文字色
    textPrimary: '#1d1d1f',
    textSecondary: '#86868b',
    textTertiary: '#aeaeb2',
    textOnPrimary: '#ffffff',

    // 边框
    border: '#d2d2d7',
    borderLight: '#e5e5ea',
    
    // 阴影
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowHeavy: 'rgba(0, 0, 0, 0.16)',
    
    // 分割线
    divider: 'rgba(0, 0, 0, 0.06)',

    // 禁用态
    disabledBg: '#f5f5f7',
    disabledText: '#c7c7cc',
  },

  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    full: 9999,
  },

  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.12)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.16)',
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
    fontSize: {
      xs: 11,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 22,
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6,
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
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },

  components: {
    button: {
      height: 36,
      padding: '0 16px',
      primary: {
        backgroundColor: '#007aff',
        color: '#ffffff',
        borderRadius: 8,
      },
      secondary: {
        backgroundColor: 'transparent',
        color: '#007aff',
        border: '1px solid #d2d2d7',
        borderRadius: 8,
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#86868b',
      },
    },
    input: {
      height: 36,
      padding: '0 12px',
      base: {
        backgroundColor: '#f5f5f7',
        border: '1px solid transparent',
        color: '#1d1d1f',
        borderRadius: 10,
      },
      focus: {
        borderColor: '#007aff',
        boxShadow: '0 0 0 3px rgba(0, 122, 255, 0.15)',
      },
    },
    select: {
      height: 36,
      padding: '0 12px',
      base: {
        backgroundColor: '#f5f5f7',
        border: '1px solid transparent',
        color: '#1d1d1f',
        borderRadius: 10,
      },
    },
    checkbox: {
      color: '#1d1d1f',
    },
    table: {
      headerBg: '#f5f5f7',
      borderColor: 'rgba(0, 0, 0, 0.06)',
    },
    toolbar: {
      backgroundColor: 'rgba(255, 255, 255, 0.72)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    },
    panel: {
      backgroundColor: '#ffffff',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      borderRadius: 16,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    },
  },
};

export default macLightTheme;
