import type { CSSProperties } from 'react';

// ---- 颜色常量 ----
export const colors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f5f5f7',
  bgTertiary: '#e8e8ed',
  bgHover: '#e2e2e7',
  bgActive: '#d1d1d6',
  bgSelected: '#007aff',
  textPrimary: '#1d1d1f',
  textSecondary: '#6e6e73',
  textTertiary: '#aeaeb2',
  textOnPrimary: '#ffffff',
  border: '#d2d2d7',
  borderLight: '#e5e5ea',
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowHeavy: 'rgba(0, 0, 0, 0.16)',
  success: '#34c759',
  warning: '#ff9f0a',
  error: '#ff3b30',
  info: '#007aff',
} as const;

// ---- 面板基础样式 ----
export const panelStyles: Record<string, CSSProperties> = {
  container: {
    backgroundColor: colors.bgPrimary,
    borderRadius: 8,
    border: `1px solid ${colors.borderLight}`,
    boxShadow: `0 1px 3px ${colors.shadow}`,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.bgSecondary,
    fontWeight: 600,
    fontSize: 13,
    color: colors.textPrimary,
    userSelect: 'none' as const,
  },
  body: {
    padding: 12,
    overflowY: 'auto' as const,
    maxHeight: 'calc(100vh - 200px)',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: 8,
    userSelect: 'none' as const,
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center' as const,
  },
};

// ---- 按钮样式 ----
const baseButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 6,
  border: 'none',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'background-color 0.15s, opacity 0.15s',
  lineHeight: 1.4,
  whiteSpace: 'nowrap' as const,
};

export const buttonStyles: Record<string, CSSProperties> = {
  primary: {
    ...baseButton,
    backgroundColor: colors.info,
    color: colors.textOnPrimary,
  },
  primaryHover: {
    ...baseButton,
    backgroundColor: '#0066d6',
    color: colors.textOnPrimary,
  },
  secondary: {
    ...baseButton,
    backgroundColor: colors.bgTertiary,
    color: colors.textPrimary,
  },
  secondaryHover: {
    ...baseButton,
    backgroundColor: colors.bgActive,
    color: colors.textPrimary,
  },
  ghost: {
    ...baseButton,
    backgroundColor: 'transparent',
    color: colors.textSecondary,
  },
  ghostHover: {
    ...baseButton,
    backgroundColor: colors.bgSecondary,
    color: colors.textPrimary,
  },
  disabled: {
    ...baseButton,
    opacity: 0.4,
    cursor: 'not-allowed' as const,
  },
  icon: {
    ...baseButton,
    padding: 6,
    minWidth: 32,
    height: 32,
  },
  danger: {
    ...baseButton,
    backgroundColor: colors.error,
    color: colors.textOnPrimary,
  },
  dangerHover: {
    ...baseButton,
    backgroundColor: '#e0342b',
    color: colors.textOnPrimary,
  },
  success: {
    ...baseButton,
    backgroundColor: colors.success,
    color: colors.textOnPrimary,
  },
};

// ---- 输入框样式 ----
export const inputStyles: Record<string, CSSProperties> = {
  base: {
    width: '100%',
    padding: '6px 10px',
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.bgPrimary,
    outline: 'none',
    boxSizing: 'border-box' as const,
    lineHeight: 1.4,
    transition: 'border-color 0.15s',
  },
  focus: {
    border: `1px solid ${colors.info}`,
    boxShadow: `0 0 0 3px rgba(0, 122, 255, 0.15)`,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: 4,
    userSelect: 'none' as const,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  row: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
};

// ---- 工具栏样式 ----
export const toolbarStyles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    backgroundColor: colors.bgPrimary,
    borderBottom: `1px solid ${colors.borderLight}`,
    userSelect: 'none' as const,
    flexShrink: 0,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
    margin: '0 4px',
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  zoomLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 44,
    textAlign: 'center' as const,
    userSelect: 'none' as const,
  },
  dropdown: {
    position: 'relative' as const,
  },
  dropdownMenu: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    marginTop: 4,
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    boxShadow: `0 4px 12px ${colors.shadowHeavy}`,
    padding: 4,
    zIndex: 1000,
    minWidth: 160,
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'background-color 0.1s',
  },
  dropdownItemHover: {
    ...baseButton,
    backgroundColor: colors.bgHover,
    color: colors.textPrimary,
    textAlign: 'left' as const,
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
};

// ---- 图层面板树形样式 ----
export const layerTreeStyles: Record<string, CSSProperties> = {
  container: {
    padding: 0,
  },
  nodeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    color: colors.textPrimary,
    transition: 'background-color 0.1s',
    userSelect: 'none' as const,
  },
  nodeRowHover: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.bgHover,
    transition: 'background-color 0.1s',
    userSelect: 'none' as const,
  },
  nodeRowSelected: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    color: colors.textOnPrimary,
    backgroundColor: colors.bgSelected,
    transition: 'background-color 0.1s',
    userSelect: 'none' as const,
  },
  nodeIcon: {
    fontSize: 14,
    width: 18,
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  nodeName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  visibilityBtn: {
    background: 'none',
    border: 'none',
    padding: 2,
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    opacity: 0.6,
    color: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  indent: {
    paddingLeft: 20,
  },
};

// ---- 监督面板样式 ----
export const supervisorStyles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  logList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: 8,
  },
  logItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 6,
    fontSize: 12,
    lineHeight: 1.5,
    transition: 'background-color 0.1s',
  },
  logItemHover: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 6,
    fontSize: 12,
    lineHeight: 1.5,
    backgroundColor: colors.bgSecondary,
  },
  logTime: {
    color: colors.textTertiary,
    fontSize: 11,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    fontFamily: 'monospace',
  },
  logDescription: {
    flex: 1,
    color: colors.textPrimary,
  },
  logStatus: {
    fontSize: 14,
    flexShrink: 0,
  },
  footer: {
    display: 'flex',
    gap: 8,
    padding: '10px 12px',
    borderTop: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.bgSecondary,
  },
};

// ---- 颜色选择器样式 ----
export const colorFieldStyles: Record<string, CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  colorInput: {
    width: 32,
    height: 32,
    padding: 2,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },
  colorText: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.bgPrimary,
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'monospace',
  },
};

// ---- Select 样式 ----
export const selectStyles: Record<string, CSSProperties> = {
  base: {
    width: '100%',
    padding: '6px 10px',
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.bgPrimary,
    outline: 'none',
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
    lineHeight: 1.4,
  },
};
