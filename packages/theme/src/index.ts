/**
 * @block-canvas/theme
 * 
 * 灵活的主题系统，支持风格切换
 * 
 * @example
 * ```tsx
 * import { ThemeProvider, macLightTheme } from '@block-canvas/theme';
 * 
 * function App() {
 *   return (
 *     <ThemeProvider theme={macLightTheme}>
 *       <Editor />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */

// 类型
export type {
  BlockCanvasTheme,
  ThemeColors,
  ThemeRadius,
  ThemeShadows,
  ThemeTypography,
  ThemeSpacing,
  ThemeTransitions,
  ThemeContextValue,
  ComponentStyleOverrides,
  ButtonStyleOverrides,
  InputStyleOverrides,
} from './types';

// Context 和 Provider
export {
  ThemeProvider,
  ThemeContext,
  useTheme,
  useThemeContext,
} from './context';
export type { ThemeProviderProps } from './context';

// 预设主题
export {
  zincDarkTheme,
  macLightTheme,
} from './presets';

// 默认导出（向后兼容）
export { zincDarkTheme as default } from './presets';
