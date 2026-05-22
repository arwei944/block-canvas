# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.0] - 2026-05-22

### 🎉 New Features

#### Theme System (@block-canvas/theme)
- **全新主题包** - 新增 `@block-canvas/theme` 包，提供灵活的主题切换能力
- **ThemeProvider** - React Context 提供主题上下文
- **useTheme Hook** - 在组件中轻松访问主题配置
- **完整类型定义** - TypeScript 类型安全的主题接口

#### Preset Themes
- **mac-light** - macOS 极简浅色风格主题
  - 苹果蓝主色调 (#007aff)
  - 系统字体栈 (SF Pro Text, Segoe UI)
  - 大圆角设计 (6-16px)
  - 柔和阴影效果
- **zinc-dark** - 默认暗色主题（向后兼容）
  - Zinc 灰色系
  - 适合深色模式

#### Component Updates
- **@block-canvas/components** - 所有 8 个组件支持主题系统
  - TextBlock, ButtonBlock, ImageBlock
  - InputBlock, SelectBlock, CheckboxBlock
  - TableBlock, ContainerBlock
- **@block-canvas/ui** - 所有面板组件支持主题系统
  - Toolbar, LayerPanel, PropertyPanel, SupervisorPanel
  - TextField, ColorField, NumberField, SelectField

#### Editor Enhancement
- **theme prop** - Editor 组件新增 `theme` 属性，支持一键切换主题
- **默认主题** - 默认使用 `zincDarkTheme`，保持向后兼容
- **主题导出** - `@block-canvas/react` 重新导出主题工具，方便使用

### 🎨 Design System

#### Colors
- `primary` / `primaryHover` - 主色及悬停态
- `success` / `warning` / `error` / `info` - 语义色
- `background` / `surface` / `surfaceHover` / `surfaceSelected` - 背景层级
- `textPrimary` / `textSecondary` / `textTertiary` / `textOnPrimary` - 文字色
- `border` / `borderLight` / `divider` - 边框色
- `shadow` / `shadowHeavy` - 阴影色

#### Typography
- 系统字体栈支持
- 6 级字号 (xs, sm, base, lg, xl, 2xl)
- 4 级字重 (normal, medium, semibold, bold)

#### Spacing & Radius
- 6 级间距 (xs, sm, md, lg, xl, 2xl)
- 4 级圆角 (sm, md, lg, full)

### 💡 Usage Example

```tsx
import { Editor, macLightTheme, zincDarkTheme } from '@block-canvas/react';

// 使用 macOS 极简浅色主题
<Editor theme={macLightTheme} />

// 使用默认暗色主题
<Editor theme={zincDarkTheme} />

// 自定义主题
<Editor theme={{
  name: 'custom',
  mode: 'light',
  colors: { /* 自定义颜色 */ },
  // ...
}} />
```

### 🔧 Technical Details

- **样式优先级**: props > style > theme defaults
- **性能优化**: 使用 `useMemo` 缓存样式计算
- **类型安全**: 完整的 TypeScript 类型定义
- **向后兼容**: 默认主题保持现有行为

### 📦 Packages

| Package | Version | Changes |
|---------|---------|---------|
| @block-canvas/core | 3.2.0 | - |
| @block-canvas/react | 3.2.0 | + theme prop, re-exports |
| @block-canvas/components | 3.2.0 | 主题支持 |
| @block-canvas/ui | 3.2.0 | 主题支持 |
| @block-canvas/theme | 3.2.0 | 🆕 新增 |

---

## [3.1.0] - 2026-05-20

### Features
- Viewer 实时联动
- MCP Server 核心功能

## [3.0.0] - 2026-05-15

### Features
- MCP Server 核心
- 初始版本发布

---

[3.2.0]: https://github.com/arwei944/block-canvas/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/arwei944/block-canvas/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/arwei944/block-canvas/releases/tag/v3.0.0
