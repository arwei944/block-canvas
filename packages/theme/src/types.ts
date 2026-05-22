/**
 * BlockCanvas 主题系统类型定义
 * 
 * 设计原则：
 * 1. 最小接口 - 只定义必要的样式变量
 * 2. 组件无关 - 不依赖具体组件实现
 * 3. 易于扩展 - 用户可以覆盖任意层级
 */

import type { CSSProperties } from 'react';

// ============ 颜色系统 ============

export interface ThemeColors {
  /** 主色 - 用于按钮、链接、选中态 */
  primary: string;
  /** 主色悬停态 */
  primaryHover: string;
  
  /** 成功色 */
  success: string;
  /** 警告色 */
  warning: string;
  /** 错误色 */
  error: string;
  /** 信息色 */
  info: string;
  
  /** 背景色 - 页面/画布背景 */
  background: string;
  /** 表面色 - 卡片/面板背景 */
  surface: string;
  /** 表面悬停态 */
  surfaceHover: string;
  /** 表面选中态 */
  surfaceSelected: string;
  
  /** 文字主色 */
  textPrimary: string;
  /** 文字次色 */
  textSecondary: string;
  /** 文字三级色 */
  textTertiary: string;
  /** 主色上的文字 */
  textOnPrimary: string;
  
  /** 边框色 */
  border: string;
  /** 边框浅色 */
  borderLight: string;
  
  /** 阴影色 */
  shadow: string;
  /** 重阴影色 */
  shadowHeavy: string;
  
  /** 分割线 */
  divider: string;
  
  /** 禁用态背景 */
  disabledBg: string;
  /** 禁用态文字 */
  disabledText: string;
}

// ============ 圆角系统 ============

export interface ThemeRadius {
  /** 小圆角 - 按钮、输入框 */
  sm: number;
  /** 中圆角 - 卡片 */
  md: number;
  /** 大圆角 - 面板 */
  lg: number;
  /** 全圆 - 标签、徽章 */
  full: number;
}

// ============ 阴影系统 ============

export interface ThemeShadows {
  /** 轻阴影 - 卡片 */
  sm: string;
  /** 中阴影 - 弹出层 */
  md: string;
  /** 重阴影 - 模态框 */
  lg: string;
}

// ============ 字体系统 ============

export interface ThemeTypography {
  /** 字体族 */
  fontFamily: string;
  /** 等宽字体 */
  fontFamilyMono: string;
  
  /** 字号 */
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
  
  /** 字重 */
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  
  /** 行高 */
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

// ============ 间距系统 ============

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

// ============ 过渡系统 ============

export interface ThemeTransitions {
  fast: string;
  normal: string;
  slow: string;
}

// ============ 组件样式覆盖（可选） ============

export interface ButtonStyleOverrides {
  /** 按钮高度 */
  height?: number;
  /** 按钮内边距 */
  padding?: string;
  /** 主按钮样式 */
  primary?: CSSProperties;
  /** 次要按钮样式 */
  secondary?: CSSProperties;
  /** 幽灵按钮样式 */
  ghost?: CSSProperties;
}

export interface InputStyleOverrides {
  /** 输入框高度 */
  height?: number;
  /** 输入框内边距 */
  padding?: string;
  /** 输入框基础样式 */
  base?: CSSProperties;
  /** 输入框聚焦样式 */
  focus?: CSSProperties;
}

export interface TableStyleOverrides {
  /** 表头背景色 */
  headerBg?: string;
  /** 边框颜色 */
  borderColor?: string;
  /** 其他 CSS 样式 */
  [key: string]: string | number | undefined;
}

export interface ComponentStyleOverrides {
  button?: ButtonStyleOverrides;
  input?: InputStyleOverrides;
  select?: InputStyleOverrides;
  checkbox?: CSSProperties;
  table?: TableStyleOverrides;
  toolbar?: CSSProperties;
  panel?: CSSProperties;
}

// ============ 完整主题接口 ============

export interface BlockCanvasTheme {
  /** 主题名称 */
  name: string;
  /** 主题模式 */
  mode: 'light' | 'dark';
  
  /** 颜色 */
  colors: ThemeColors;
  /** 圆角 */
  radius: ThemeRadius;
  /** 阴影 */
  shadows: ThemeShadows;
  /** 字体 */
  typography: ThemeTypography;
  /** 间距 */
  spacing: ThemeSpacing;
  /** 过渡 */
  transitions: ThemeTransitions;
  
  /** 组件样式覆盖（可选） */
  components?: ComponentStyleOverrides;
}

// ============ 主题上下文值 ============

export interface ThemeContextValue {
  /** 当前主题 */
  theme: BlockCanvasTheme;
  /** 切换主题 */
  setTheme: (theme: BlockCanvasTheme) => void;
}
