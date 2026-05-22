/**
 * 主题上下文和 Provider
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import type { BlockCanvasTheme, ThemeContextValue } from './types';
import { zincDarkTheme } from './presets/zinc-dark';

// ============ Context ============

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============ Provider ============

export interface ThemeProviderProps {
  /** 初始主题，默认为 zinc-dark */
  theme?: BlockCanvasTheme;
  /** 子组件 */
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  theme: initialTheme = zincDarkTheme,
  children,
}) => {
  const [theme, setTheme] = useState<BlockCanvasTheme>(initialTheme);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============ Hook ============

/**
 * 获取当前主题
 * @returns 主题对象
 * @throws 如果不在 ThemeProvider 内会抛出错误
 */
export function useTheme(): BlockCanvasTheme {
  const context = useContext(ThemeContext);
  if (!context) {
    // 返回默认主题而不是抛出错误，提高容错性
    return zincDarkTheme;
  }
  return context.theme;
}

/**
 * 获取主题上下文（包含 setTheme）
 * @returns 主题上下文值
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

// ============ 导出 Context（高级用法） ============

export { ThemeContext };
