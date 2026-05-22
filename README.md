<p align="center">
  <img src="https://img.shields.io/badge/version-v1.0.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license" />
  <img src="https://img.shields.io/badge/React-18-61dafb" alt="react" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178c6" alt="typescript" />
  <img src="https://img.shields.io/badge/tests-80%20passed-brightgreen" alt="tests" />
  <img src="https://img.shields.io/badge/packages-6-orange" alt="packages" />
</p>

<h1 align="center">🧩 BlockCanvas</h1>

<p align="center">
  <strong>面向智能体的可视化画布前端框架</strong><br/>
  Agent-First Visual Canvas Framework
</p>

<p align="center">
  像搭积木一样构建前端页面，让 AI 智能体成为你的前端工程师。<br/>
  人类只负责监督和可视化，智能体负责所有创建工作。
</p>

---

## ✨ 为什么选择 BlockCanvas？

传统的前端开发流程中，每次新项目都要重复设计页面结构、编写样式代码。**BlockCanvas 将前端开发抽象为积木搭建**：

- 🤖 **Agent-First 设计** — 专为 AI 智能体优化的 API，智能体可以通过结构化 API 或自然语言来创建页面
- 🧩 **积木式搭建** — 所有 UI 元素都是可组合的积木块，在画布上自由拖拽排列
- 📐 **空间语义** — 智能体说"居中"、"三栏布局"，框架自动计算 CSS
- 🔍 **自我诊断** — 自动检测布局问题（重叠、溢出、未对齐等），并给出修复建议
- 🔌 **插件化架构** — 核心引擎零 UI 依赖，UI 完全可替换
- 📤 **双格式导出** — JSON Schema + HTML/CSS/JS，对接任何后端

## 🏗 架构概览

```
┌─────────────────────────────────────────────────┐
│                  Agent SDK                       │
│  结构化 API · 自然语言意图 · 批量事务 · 视觉反馈  │
├─────────────────────────────────────────────────┤
│              Application Layer                   │
│         REST API (13 个端点)                      │
├──────────┬──────────┬──────────┬────────────────┤
│  UI Kit  │ Toolbar  │ Layer    │ Property       │
│          │ Panel    │ Panel    │ Panel          │
├──────────┴──────────┴──────────┴────────────────┤
│              React Bindings                      │
│         Canvas · Editor · NodeElement            │
├─────────────────────────────────────────────────┤
│               Core Engine                        │
│  节点模型 · Zustand Store · 命令系统 · 快照引擎   │
│  空间语义 · 意图引擎 · 诊断引擎 · 插件系统        │
├─────────────────────────────────────────────────┤
│              Data Layer                          │
│        JSON / HTML 导入导出                      │
└─────────────────────────────────────────────────┘
```

## 📦 包结构

| 包名 | 说明 |
|------|------|
| [`@block-canvas/core`](packages/core) | 核心引擎 — 节点模型、Zustand 状态管理、命令系统、快照引擎、空间语义 API、自然语言意图引擎、诊断引擎、插件系统、JSON/HTML 导出器、REST 服务 |
| [`@block-canvas/react`](packages/react) | React 绑定 — Canvas 画布、Editor 编辑器、NodeElement 节点渲染、Context、Hooks |
| [`@block-canvas/components`](packages/components) | 内置组件 — 文本、图片、按钮、容器、输入框、下拉框、复选框、表格 |
| [`@block-canvas/agent-sdk`](packages/agent-sdk) | 智能体 SDK — 节点 CRUD API、批量事务、视觉反馈（截图/快照/描述/诊断）、画布自描述 |
| [`@block-canvas/ui`](packages/ui) | 默认 UI — 工具栏、图层面板、属性面板、监督面板 |
| [`@block-canvas/playground`](apps/playground) | 演练场 — 完整编辑器布局，开箱即用 |

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/arwei944/block-canvas.git
cd block-canvas

# 安装依赖
pnpm install

# 启动演练场
pnpm dev
```

打开浏览器访问 `http://localhost:5173`，即可看到完整的编辑器界面。

### 构建所有包

```bash
pnpm build
```

### 运行测试

```bash
pnpm --filter @block-canvas/core test
```

## 🤖 智能体使用方式

BlockCanvas 提供三种智能体交互方式：

### 方式一：结构化 API（推荐）

```typescript
import { BlockCanvasClient } from '@block-canvas/agent-sdk';

const client = new BlockCanvasClient({ endpoint: 'http://localhost:3000' });

// 添加节点
const { nodeId } = await client.nodes.add({
  parentId: 'root',
  type: 'text',
  name: '标题',
  data: { content: '欢迎使用 BlockCanvas' },
  style: { fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' },
});

// 获取视觉反馈
const snapshot = await client.feedback.snapshot();
const description = await client.feedback.describe();
const diagnosis = await client.feedback.diagnose();
```

### 方式二：自然语言意图

```typescript
// 智能体用自然语言描述意图，框架自动解析为结构化操作
intentEngine.execute(store, '添加一个标题文本"欢迎使用"，字号24px，加粗，居中');
intentEngine.execute(store, '在"主要内容"容器中添加一个按钮"提交"，蓝色主题');
intentEngine.execute(store, '将"侧边栏"和"内容区"设为两栏布局');
```

### 方式三：批量事务

```typescript
const tx = client.transaction.begin();

// 在事务中操作，使用 pending 引用
const headerId = tx.nodes.add({ parentId: 'root', type: 'container', name: '页眉' });
const titleId = tx.nodes.add({ parentId: headerId, type: 'text', name: '标题' });
tx.nodes.updateStyle(titleId, { fontSize: '32px', fontWeight: 'bold' });

// 一次性提交
const result = await tx.commit();
// result.idMap: { '<pending:0>': 'real-id-1', '<pending:1>': 'real-id-2' }
```

## 📐 空间语义 API

智能体不需要写 CSS，用语义化指令控制布局：

```typescript
import { SpatialAPI } from '@block-canvas/core';

// 预设布局
SpatialAPI.applyPreset(store, 'sidebar-content', { sidebar: sidebarId, content: contentId });
SpatialAPI.applyPreset(store, 'holy-grail', { header, sidebar, content, footer });
SpatialAPI.applyPreset(store, 'dashboard-grid', { panels: [p1, p2, p3, p4] });

// 对齐与分布
SpatialAPI.align(store, { axis: 'horizontal', align: 'center', nodeIds: [a, b, c] });
SpatialAPI.distribute(store, { axis: 'vertical', nodeIds: [a, b, c] });
SpatialAPI.center(store, { in: containerId, axis: 'both', nodeId: targetId });
```

**7 种预设布局**：侧边栏、居中堆叠、圣杯布局、仪表盘网格、页眉-内容-页脚、双栏、三栏

## 🔍 诊断引擎

自动检测 7 种常见布局问题：

| 问题类型 | 说明 |
|---------|------|
| `overlap` | 元素之间发生重叠 |
| `overflow` | 内容超出容器边界 |
| `misalignment` | 元素未正确对齐 |
| `inconsistency` | 相似元素样式不一致 |
| `empty-container` | 容器中没有子元素 |
| `deep-nesting` | 嵌套层级过深 |
| `tiny-element` | 元素尺寸过小 |

```typescript
const report = await client.feedback.diagnose();
// report.issues: [{ nodeId, severity, message, suggestion }]
```

## 🧩 内置组件

| 组件 | 类型 | 说明 |
|------|------|------|
| TextBlock | `text` | 文本/标题/段落 |
| ImageBlock | `image` | 图片展示 |
| ButtonBlock | `button` | 按钮（primary/secondary/ghost） |
| ContainerBlock | `container` | 容器，支持嵌套 |
| InputBlock | `text` | 文本输入框 |
| SelectBlock | `text` | 下拉选择框 |
| CheckboxBlock | `text` | 复选框 |
| TableBlock | `text` | 数据表格 |

> 所有组件通过插件系统注册，支持自定义扩展。

## 📤 导出格式

### JSON Schema

```typescript
import { JsonExporter } from '@block-canvas/core';

const json = JsonExporter.export(document);
const imported = JsonExporter.import(json);
```

### HTML / CSS / JS

```typescript
import { HtmlExporter } from '@block-canvas/core';

const html = HtmlExporter.export(document);
// 生成完整的 HTML 页面，包含内联 CSS 和交互 JS
```

## 🔌 插件系统

```typescript
import { PluginManager } from '@block-canvas/core';

const pm = new PluginManager(store);

// 注册自定义组件
pm.registerComponent({
  type: 'chart',
  name: '图表',
  renderer: ChartComponent,
  defaultProps: { data: [] },
});

// 注册自定义导出器
pm.registerExporter({
  name: 'vue',
  export: (doc) => generateVueCode(doc),
});
```

## 🛠 技术栈

- **React 18** — UI 渲染
- **TypeScript 5.4** — 类型安全
- **Zustand 5** — 状态管理
- **Vitest** — 单元测试（80 个测试全部通过）
- **pnpm** — Monorepo 管理
- **Vite** — 开发服务器和构建工具
- **原生 HTTP** — REST API 服务（零依赖）

## 📁 项目结构

```
block-canvas/
├── apps/
│   └── playground/          # 演练场应用
├── packages/
│   ├── core/                # 核心引擎
│   │   └── src/
│   │       ├── types/       # 类型定义
│   │       ├── node/        # 节点模型
│   │       ├── store/       # Zustand 状态管理
│   │       ├── commands/    # 命令系统（撤销/重做）
│   │       ├── snapshot/    # 快照引擎
│   │       ├── spatial/     # 空间语义 API
│   │       ├── intent/      # 自然语言意图引擎
│   │       ├── diagnose/    # 诊断引擎
│   │       ├── plugin/      # 插件系统
│   │       ├── exporters/   # JSON/HTML 导出器
│   │       └── server/      # REST API 服务
│   ├── react/               # React 绑定
│   ├── components/          # 内置组件
│   ├── agent-sdk/           # 智能体 SDK
│   └── ui/                  # 默认 UI 组件
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 📜 License

[MIT](LICENSE)
