# BlockCanvas 开发计划

> **版本**: v2.0.0 → v3.2.0
> **更新日期**: 2026-05-19
> **项目定位**: Agent-First 可视化画布前端框架（MCP 服务）

---

## 目录

1. [项目概述](#1-项目概述)
2. [架构设计](#2-架构设计)
3. [MCP 能力设计](#3-mcp-能力设计)
4. [版本路线图](#4-版本路线图)
5. [GitHub 版本管理策略](#5-github-版本管理策略)
6. [测试策略](#6-测试策略)
7. [风险与缓解](#7-风险与缓解)
8. [时间规划](#8-时间规划)

---

## 1. 项目概述

### 1.1 项目定位

BlockCanvas 是一个 **Agent-First** 的可视化画布前端框架，以 **MCP（Model Context Protocol）服务** 的形式提供。它让 AI Agent 能够像人类设计师一样，通过可视化的方式构建、编辑和预览前端页面。

### 1.2 核心价值主张

| 维度 | 说明 |
|------|------|
| **可视化** | 提供实时画布预览，所见即所得 |
| **模块化** | 组件可插拔、插件可扩展、导出格式可定制 |
| **Agent-First** | 以 AI Agent 为第一用户，所有能力通过 MCP 协议暴露 |

### 1.3 目标用户

- **AI Agent**：Claude、Cursor、Windsurf 等支持 MCP 协议的 AI 编程助手
- **开发者**：需要快速原型设计的全栈开发者
- **设计工程师**：需要将设计稿快速转化为可运行代码的团队

### 1.4 当前状态

- **当前版本**：v2.0.0
- **已完成**：
  - 核心引擎（EditorStore、CommandManager、PluginManager）
  - 基础组件库（Text、Image、Button、Container、Input、Select、Checkbox、Table）
  - React 渲染层（Canvas、Editor、NodeElement）
  - 空间布局 API（SpatialAPI）
  - 意图解析引擎（IntentEngine）
  - 诊断引擎（DiagnoseEngine）
  - 快照引擎（SnapshotEngine）
  - HTML/JSON 导出器
  - Agent SDK（HTTP 客户端）
  - Amber UI 风格复刻（Playground）

---

## 2. 架构设计

### 2.1 目标架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Agent (MCP Client)                    │
│              Claude Desktop / Cursor / Windsurf / ...           │
└────────────────────────────┬────────────────────────────────────┘
                             │ MCP Protocol (stdio)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MCP Server                                │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Tools   │  │ Resources │  │  Prompts │  │ Instructions │  │
│  │  (~25个) │  │  (3个)    │  │  (3个)   │  │  (使用指南)  │  │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └──────────────┘  │
│       └───────────────┴─────────────┘                           │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Core Engine                            │  │
│  │  ┌────────────┐ ┌──────────────┐ ┌───────────────────┐  │  │
│  │  │EditorStore │ │CommandManager│ │  PluginManager    │  │  │
│  │  └────────────┘ └──────────────┘ └───────────────────┘  │  │
│  │  ┌────────────┐ ┌──────────────┐ ┌───────────────────┐  │  │
│  │  │SnapshotEng │ │DiagnoseEngine│ │  IntentEngine     │  │  │
│  │  └────────────┘ └──────────────┘ └───────────────────┘  │  │
│  │  ┌────────────┐ ┌──────────────┐ ┌───────────────────┐  │  │
│  │  │ SpatialAPI │ │  Exporters   │ │  SpatialAPI       │  │  │
│  │  └────────────┘ └──────────────┘ └───────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Store (Document)                       │  │
│  │  nodes[] | styles{} | layout{} | metadata{}              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ SSE (Server-Sent Events)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Viewer (实时预览)                            │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Canvas  │  │ LayerPanel│  │ PropPanel│  │ Supervisor   │  │
│  │  (画布)  │  │ (图层面板)│  │ (属性面板)│  │ (操作日志)   │  │
│  └──────────┘  └───────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 包结构（重构后）

```
block-canvas/
├── packages/
│   ├── core/              # 核心引擎（保持不变）
│   │   ├── src/
│   │   │   ├── store/         # EditorStore - 文档状态管理
│   │   │   ├── commands/      # CommandManager - 命令模式（撤销/重做）
│   │   │   ├── plugin/        # PluginManager - 插件生命周期
│   │   │   ├── snapshot/      # SnapshotEngine - 画布快照
│   │   │   ├── diagnose/      # DiagnoseEngine - 布局诊断
│   │   │   ├── intent/        # IntentEngine - 自然语言意图解析
│   │   │   ├── spatial/       # SpatialAPI - 空间布局
│   │   │   ├── exporters/     # 导出器（HTML/JSON/React）
│   │   │   └── types/         # 类型定义
│   │   └── package.json
│   │
│   ├── components/        # 组件库（保持不变）
│   │   ├── src/
│   │   │   ├── basic/         # 基础组件（Text, Image, Button）
│   │   │   ├── layout/        # 布局组件（Container）
│   │   │   ├── form/          # 表单组件（Input, Select, Checkbox）
│   │   │   ├── data/          # 数据组件（Table）
│   │   │   └── registry.ts    # 组件注册表
│   │   └── package.json
│   │
│   ├── react/             # React 渲染层（保持不变）
│   │   ├── src/
│   │   │   ├── Canvas/        # 画布组件
│   │   │   ├── Editor/        # 编辑器组件
│   │   │   ├── NodeElement/   # 节点元素组件
│   │   │   ├── context/       # React Context
│   │   │   └── hooks/         # 自定义 Hooks
│   │   └── package.json
│   │
│   ├── mcp-server/        # 【新增】MCP Server（替代 agent-sdk）
│   │   ├── src/
│   │   │   ├── index.ts       # Server 入口
│   │   │   ├── tools/         # MCP Tools 定义
│   │   │   ├── resources/     # MCP Resources 定义
│   │   │   ├── prompts/       # MCP Prompts 定义
│   │   │   └── instructions/  # Server Instructions
│   │   └── package.json
│   │
│   └── viewer/            # 【新增】预览应用（从 playground 演化）
│       ├── src/
│       │   ├── App.tsx
│       │   ├── panels/        # 各面板组件
│       │   └── sse-client.ts  # SSE 连接客户端
│       └── package.json
│
├── apps/
│   └── playground/        # 开发调试用（保留）
│
├── docs/                  # 项目文档
├── pnpm-workspace.yaml
└── package.json
```

### 2.3 关键架构决策

| 决策 | 旧方案 | 新方案 | 原因 |
|------|--------|--------|------|
| Agent 通信方式 | agent-sdk（HTTP 客户端） | mcp-server（MCP 协议） | MCP 是 AI Agent 的事实标准协议 |
| 数据传输路径 | Agent → REST Server → Core Engine | Agent → MCP Server → Core Engine | 消除 HTTP 中间层，零开销 |
| 预览同步方式 | 轮询 / 手动刷新 | SSE（Server-Sent Events） | 实时推送，延迟 < 100ms |
| 包管理方式 | agent-sdk 独立包 | mcp-server 内置于 monorepo | 减少维护成本，统一版本管理 |

---

## 3. MCP 能力设计

### 3.1 Tools（约 25 个，分 5 组）

#### 节点操作（9 个）

| Tool 名称 | 说明 | 输入 | 输出 |
|-----------|------|------|------|
| `add_node` | 添加节点 | type, parentId?, style?, data? | 创建的节点（含 ID） |
| `get_node` | 获取节点 | nodeId | 节点详情（含样式和布局） |
| `update_node_data` | 更新节点数据 | nodeId, data | 更新后的节点 |
| `update_node_style` | 更新节点样式 | nodeId, style | 更新后的节点 |
| `update_node_layout` | 更新节点布局 | nodeId, layout | 更新后的节点 |
| `remove_node` | 删除节点 | nodeId | 操作结果 |
| `move_node` | 移动节点 | nodeId, newParentId, index? | 操作结果 |
| `duplicate_node` | 复制节点 | nodeId | 新节点（含 ID） |
| `query_nodes` | 查询节点 | type?, parentId? | 匹配的节点列表 |

#### 文档操作（4 个）

| Tool 名称 | 说明 | 输入 | 输出 |
|-----------|------|------|------|
| `undo` | 撤销上一步操作 | - | 操作结果 |
| `redo` | 重做已撤销操作 | - | 操作结果 |
| `export_document` | 导出文档 | format: "html" \| "json" \| "react" | 导出内容 |
| `import_document` | 导入文档 | content, format | 导入结果 |

#### 画布感知（5 个）

| Tool 名称 | 说明 | 输入 | 输出 |
|-----------|------|------|------|
| `get_canvas_snapshot` | 获取画布快照 | level?: "summary" \| "full" | 画布状态数据 |
| `describe_canvas` | 自然语言描述画布 | detail?: "concise" \| "detailed" | 文本描述 |
| `get_component_defs` | 获取组件定义 | - | 组件列表及 Schema |
| `get_node_relationships` | 获取节点关系 | nodeId? | 父子/兄弟关系图 |
| `diagnose_layout` | 诊断布局问题 | - | 问题列表 + 修复建议 |

#### 布局操作（6 个）

| Tool 名称 | 说明 | 输入 | 输出 |
|-----------|------|------|------|
| `set_layout` | 设置布局模式 | nodeId, type: "flex" \| "grid" \| "free", options? | 操作结果 |
| `apply_layout_preset` | 应用布局预设 | nodeId, preset: 7种预设之一 | 操作结果 |
| `align_nodes` | 对齐节点 | nodeIds, direction: "horizontal" \| "vertical", position | 操作结果 |
| `distribute_nodes` | 均匀分布节点 | nodeIds, direction | 操作结果 |
| `center_node` | 居中节点 | nodeId, direction?: "both" \| "horizontal" \| "vertical" | 操作结果 |
| `set_node_size` | 设置节点尺寸 | nodeId, width?, height?, constraints? | 操作结果 |

#### 批量事务（1 个）

| Tool 名称 | 说明 | 输入 | 输出 |
|-----------|------|------|------|
| `execute_transaction` | 批量执行操作 | operations[], description? | 所有操作结果（原子性） |

> **pendingId 机制**：在 `execute_transaction` 中，后续操作可以通过 `pendingId` 引用前面操作创建的节点 ID，实现"创建按钮并添加到刚创建的容器中"这类依赖操作。

### 3.2 Resources（3 个）

| Resource URI | 说明 | MIME Type |
|-------------|------|-----------|
| `canvas://snapshot` | 当前画布快照 | `application/json` |
| `canvas://components` | 组件定义列表 | `application/json` |
| `canvas://relationships` | 节点关系图 | `application/json` |

### 3.3 Prompts（3 个）

| Prompt 名称 | 触发场景 | 说明 |
|-------------|---------|------|
| `build_page_from_scratch` | 从零构建页面 | 引导 AI 按步骤创建完整页面 |
| `fix_layout_issues` | 修复布局问题 | 引导 AI 诊断并修复布局缺陷 |
| `apply_design_system` | 应用设计系统 | 引导 AI 统一配色、字体、间距 |

---

## 4. 版本路线图

### 4.1 v2.1.0 - 修复与稳定性

> **目标**：修复已知问题，提升代码质量，为 v3.0.0 重构打好基础。

#### 任务列表

| # | 任务 | 详细说明 | 验收标准 |
|---|------|---------|---------|
| 1 | 修复 `@block-canvas/ui` 包 | `shared/styles.ts` 被删除导致无法编译。用 Tailwind CSS 重写所有面板组件，或清理废弃代码 | ui 包能正常编译，`tsc` 无错误 |
| 2 | SupervisorPanel 接入真实数据 | 替换硬编码日志，接入 `CommandManager` 命令历史 | 操作日志实时显示真实命令记录 |
| 3 | Editor document prop 联动 | 修复 TODO：当 document prop 变化时调用 `initDocument` | 外部传入 document 时正确初始化 |
| 4 | API Server 与 Agent SDK 路由对齐 | 统一路由格式（`/api/nodes/add` → `POST /nodes`） | 所有 SDK API 能正确调用 Server 路由 |
| 5 | 补充单元测试 | 为 core store、CommandManager、PluginManager 添加测试 | 测试覆盖率 > 60% |

---

### 4.2 v3.0.0 - MCP Server 核心（里程碑版本）

> **目标**：实现完整的 MCP Server，让 Claude Desktop 等 AI Agent 能直接通过 MCP 协议操控画布。

#### 任务列表

| # | 任务 | 详细说明 | 验收标准 |
|---|------|---------|---------|
| 1 | 引入 `@modelcontextprotocol/sdk` | 安装依赖，创建 `mcp-server` 包骨架 | 能通过 stdio 启动 MCP Server |
| 2 | 实现节点操作 Tools（9 个） | `add_node`, `get_node`, `update_node_data`, `update_node_style`, `update_node_layout`, `remove_node`, `move_node`, `duplicate_node`, `query_nodes` | 每个 Tool 有完整的 `inputSchema`（zod），AI 能成功调用 |
| 3 | 实现文档操作 Tools（4 个） | `undo`, `redo`, `export_document`（html/json/react）, `import_document` | undo/redo 正常工作，导出生成有效文件 |
| 4 | 实现画布感知 Resources（5 个） | `get_canvas_snapshot`, `describe_canvas`, `get_component_defs`, `get_node_relationships`, `diagnose_layout` | AI 能获取画布完整状态和自然语言描述 |
| 5 | 实现布局操作 Tools（6 个） | `set_layout`, `apply_layout_preset`, `align_nodes`, `distribute_nodes`, `center_node`, `set_node_size` | 7 种布局预设全部可用 |
| 6 | 实现批量事务 Tool | `execute_transaction` with `pendingId` references | 批量操作原子性，pendingId 正确解析 |
| 7 | 实现 MCP Prompts（3 个） | "从零构建页面"、"修复布局问题"、"应用设计系统" | Claude Desktop 能加载并使用这些 Prompt |
| 8 | Server Instructions 编写 | 编写跨工具使用说明和工作流指引 | 新 AI Agent 无需额外文档即可正确使用 |
| 9 | 补全 DiagnoseEngine autoFix 执行逻辑 | - | `diagnose_layout` 返回的问题可一键修复 |
| 10 | 扩展导出格式 | 新增 React/JSX 导出器 | 导出的 React 代码可直接运行 |

---

### 4.3 v3.1.0 - Viewer 实时联动

> **目标**：实现 Viewer 与 MCP Server 的实时同步，让用户能实时观察 AI 的操作过程。

#### 任务列表

| # | 任务 | 详细说明 | 验收标准 |
|---|------|---------|---------|
| 1 | SSE 状态同步 | MCP Server 启动时同时启动 HTTP SSE 服务，Viewer 通过 `EventSource` 连接接收变更 | AI 操作画布后 Viewer < 100ms 更新 |
| 2 | 截图反馈 | MCP Server 集成 Playwright 截图能力，AI 调用 screenshot tool 获取 PNG base64 | AI 能"看到"自己创建的 UI |
| 3 | Agent 操作可视化 | Viewer 中高亮显示 AI 正在操作的节点，操作日志面板实时滚动 | 用户能实时观察 AI 的每一步操作 |
| 4 | 持久化层 | localStorage + IndexedDB 自动保存，`.bcanvas` 项目文件 打开/保存 | 刷新页面不丢失数据 |

---

### 4.4 v3.2.0 - 生态扩展

> **目标**：扩展组件库和插件系统，打造可扩展的前端构建生态。

#### 任务列表

| # | 任务 | 详细说明 | 验收标准 |
|---|------|---------|---------|
| 1 | 扩展组件库 | 新增：Heading, Link, Divider, Avatar, Badge, Card, Modal, Code, Icon, List, Tabs, Accordion | 每个组件可渲染、可配置、可导出 |
| 2 | 插件市场基础 | 插件安装/卸载/启用/禁用 UI，插件列表 API | 通过 MCP Tool 管理插件生命周期 |
| 3 | 官方插件示例 | Markdown 编辑器插件、图表插件（Chart.js 集成）、图标库插件（Lucide 集成） | 每个插件可独立安装和使用 |
| 4 | 主题系统 | 可自定义亮/暗主题配色方案，Design Token 编辑器 | 用户可切换预设主题或自定义配色 |

---

## 5. GitHub 版本管理策略

### 5.1 分支模型

```
main (稳定发布)
  │
  ├── release/v3.0.0 (发布准备)
  │     │
  └── develop (开发集成)
        │
        ├── feature/v3.0.0/mcp-server-tools
        ├── feature/v3.0.0/layout-presets
        ├── feature/v3.1.0/sse-sync
        │
        └── hotfix/critical-fix (从 main 创建)
```

| 分支类型 | 命名规范 | 说明 |
|---------|---------|------|
| `main` | - | 稳定发布分支，只接受 PR 合并 |
| `develop` | - | 开发集成分支 |
| `feature` | `feature/v{version}/{task-name}` | 功能分支 |
| `hotfix` | `hotfix/{description}` | 紧急修复分支 |
| `release` | `release/v{version}` | 发布准备分支 |

### 5.2 Git 工作流

```
1. feature 分支从 develop 创建
2. 开发完成后提交 PR 到 develop（Code Review）
3. develop 测试通过后，创建 release 分支
4. release 分支测试通过后合并到 main 并打 tag
5. hotfix 从 main 创建，修复后合并到 main + develop
```

### 5.3 Commit 规范

```
<type>(<scope>): <subject>

<body>
```

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(mcp-server): add execute_transaction tool` |
| `fix` | 修复 | `fix(core): resolve circular reference detection` |
| `refactor` | 重构 | `refactor(ui): rewrite panels with Tailwind CSS` |
| `docs` | 文档 | `docs: update development plan` |
| `test` | 测试 | `test(core): add CommandManager unit tests` |
| `chore` | 构建/工具 | `chore: update dependencies` |

### 5.4 Milestone 规划

| Milestone | 版本 | Issue 数量 | 关键目标 |
|-----------|------|-----------|---------|
| M1 | v2.1.0 | 5 issues | 修复与稳定性 |
| M2 | v3.0.0 | 10 issues | MCP Server 核心 |
| M3 | v3.1.0 | 4 issues | Viewer 实时联动 |
| M4 | v3.2.0 | 4 issues | 生态扩展 |

### 5.5 Label 体系

| 类别 | Label | 说明 |
|------|-------|------|
| **type** | `type: feature` | 新功能 |
| | `type: bugfix` | Bug 修复 |
| | `type: refactor` | 重构 |
| | `type: docs` | 文档 |
| | `type: test` | 测试 |
| | `type: chore` | 构建/工具 |
| **scope** | `scope: core` | 核心引擎 |
| | `scope: mcp-server` | MCP Server |
| | `scope: viewer` | Viewer 预览应用 |
| | `scope: components` | 组件库 |
| | `scope: react` | React 渲染层 |
| | `scope: ui` | UI 面板 |
| **priority** | `priority: critical` | 紧急 |
| | `priority: high` | 高优先级 |
| | `priority: medium` | 中优先级 |
| | `priority: low` | 低优先级 |
| **status** | `status: in-progress` | 进行中 |
| | `status: review` | 待 Review |
| | `status: blocked` | 被阻塞 |

---

## 6. 测试策略

### 6.1 测试分层

```
┌─────────────────────────────────────────┐
│         E2E 测试 (Playwright)           │  ← Viewer + MCP Server 联动
├─────────────────────────────────────────┤
│         集成测试 (Vitest)               │  ← MCP Tool 端到端测试
├─────────────────────────────────────────┤
│         单元测试 (Vitest)               │  ← 核心引擎、工具函数
└─────────────────────────────────────────┘
```

| 层级 | 工具 | 覆盖范围 | 目标覆盖率 |
|------|------|---------|-----------|
| 单元测试 | Vitest | 核心引擎、工具函数 | > 80% |
| 集成测试 | Vitest | MCP Tool 端到端 | 全部 Tools |
| E2E 测试 | Playwright | Viewer + MCP Server 联动 | 关键流程 |

---

### 6.2 v2.1.0 测试用例

#### Core Store 测试

```typescript
describe('EditorStore')
  - should initialize with empty document
  - should add a text node
  - should add an image node
  - should add a button node
  - should add a container node with children
  - should update node style
  - should update node layout
  - should update node data
  - should remove a node (and its children recursively)
  - should move a node to a new parent
  - should prevent moving a node into its own descendant
  - should select a single node
  - should select multiple nodes (shift+click)
  - should clear selection
  - should set zoom (clamped to 0.1-5)
  - should detect circular references on move
  - should duplicate a node
  - should initialize document
```

#### CommandManager 测试

```typescript
describe('CommandManager')
  - should register a command
  - should execute a command
  - should undo the last command
  - should redo an undone command
  - should handle multiple undo/redo cycles
  - should clear redo stack on new command
  - should not undo when history is empty
  - should not redo when redo stack is empty
  - built-in node.add command should work
  - built-in node.remove command should work
  - built-in node.update command should work
  - built-in node.updateStyle command should work
  - built-in node.updateLayout command should work
  - built-in node.move command should work
```

#### PluginManager 测试

```typescript
describe('PluginManager')
  - should register a plugin
  - should initialize a plugin
  - should check plugin dependencies
  - should fail if dependency not met
  - should unregister a plugin
  - should call plugin destroy on unregister
  - should emit events
  - should register component via plugin
  - should register exporter via plugin
  - should register command via plugin
```

#### SnapshotEngine 测试

```typescript
describe('SnapshotEngine')
  - should generate summary snapshot
  - should generate full snapshot
  - should include styles when requested
  - should include layout when requested
  - should generate concise description
  - should generate detailed description
  - should handle empty document
  - should handle deeply nested structure
```

#### DiagnoseEngine 测试

```typescript
describe('DiagnoseEngine')
  - should detect overlapping nodes
  - should detect overflow
  - should detect misalignment
  - should detect style inconsistency
  - should detect empty containers
  - should detect deep nesting (> 5 levels)
  - should detect tiny elements (< 20px)
  - should return empty report for healthy layout
  - should generate summary text
```

#### SpatialAPI 测试

```typescript
describe('SpatialAPI')
  - should set flex layout
  - should set grid layout
  - should apply sidebar-content preset
  - should apply center-stack preset
  - should apply holy-grail preset
  - should apply dashboard-grid preset
  - should apply header-content-footer preset
  - should apply two-columns preset
  - should apply three-columns preset
  - should align nodes horizontally
  - should align nodes vertically
  - should distribute nodes evenly
  - should center node in container
  - should set node gap
  - should set node size with constraints
```

#### IntentEngine 测试

```typescript
describe('IntentEngine')
  - should parse "添加一个按钮"
  - should parse "在导航栏添加一个Logo"
  - should parse "删除按钮"
  - should parse "设置按钮的背景色为蓝色"
  - should parse "设置标题的文字为Hello World"
  - should parse "让登录表单居中"
  - should parse "设置导航栏为水平布局"
  - should parse "把按钮移到表单容器"
  - should parse "设置表单的间距为16px"
  - should parse "设置图片的宽度为100%"
  - should parse "应用侧边栏布局"
  - should preview without executing
  - should execute batch intents
  - should handle unknown intent gracefully
  - should map Chinese color names
  - should map Chinese component names
```

#### Exporter 测试

```typescript
describe('HTMLExporter')
  - should export text node as div
  - should export image node as img
  - should export button node as button
  - should export container with children
  - should inline styles correctly
  - should handle nested containers
  - should generate valid HTML document

describe('JSONExporter')
  - should export document to JSON
  - should import document from JSON
  - should validate imported document
  - should reject invalid JSON
```

---

### 6.3 v3.0.0 MCP Server 测试用例

#### MCP Server 启动测试

```typescript
describe('MCP Server')
  - should start via stdio transport
  - should report correct server name and version
  - should list all registered tools
  - should list all registered resources
  - should list all registered prompts
```

#### 节点操作 Tools 测试

```typescript
describe('Tool: add_node')
  - should add a text node with default style
  - should add a node to specific parent
  - should add a node with custom style
  - should add a node with custom data
  - should return the created node with ID
  - should reject invalid node type

describe('Tool: get_node')
  - should return node by ID
  - should return null for non-existent node
  - should include style and layout info

describe('Tool: update_node_style')
  - should update single style property
  - should update multiple style properties
  - should reject invalid style property
  - should trigger undo history

describe('Tool: remove_node')
  - should remove a leaf node
  - should remove a container with all children
  - should reject removing root node
  - should trigger undo history

describe('Tool: move_node')
  - should move node to new parent
  - should move node to specific index
  - should reject moving into own descendant
  - should trigger undo history

describe('Tool: query_nodes')
  - should query all nodes
  - should filter by type
  - should filter by parentId
  - should return empty for no matches
```

#### 布局操作 Tools 测试

```typescript
describe('Tool: apply_layout_preset')
  - should apply sidebar-content preset
  - should apply center-stack preset
  - should apply holy-grail preset
  - should reject unknown preset name

describe('Tool: set_layout')
  - should set flex layout with direction
  - should set grid layout with columns
  - should set free layout

describe('Tool: align_nodes')
  - should align nodes horizontally (start/center/end)
  - should align nodes vertically (start/center/end)
  - should require at least 2 nodes
```

#### 批量事务测试

```typescript
describe('Tool: execute_transaction')
  - should execute multiple operations atomically
  - should resolve pendingId references
  - should rollback on failure
  - should support nested pendingId references
  - should create single undo entry for entire transaction
```

#### Resources 测试

```typescript
describe('Resource: canvas_snapshot')
  - should return summary snapshot
  - should return full snapshot with styles
  - should return tree structure

describe('Resource: component_definitions')
  - should list all registered components
  - should include component schema
```

#### Prompts 测试

```typescript
describe('Prompt: build_page_from_scratch')
  - should return structured messages
  - should include available components info
  - should guide step-by-step workflow
```

---

### 6.4 v3.1.0 测试用例

#### SSE 同步测试

```typescript
describe('SSE Transport')
  - should connect viewer via EventSource
  - should push node changes in real-time
  - should push selection changes
  - should push zoom changes
  - should handle multiple viewers
  - should disconnect cleanly
```

#### 截图测试

```typescript
describe('Screenshot Tool')
  - should capture canvas as PNG
  - should return base64 encoded image
  - should handle empty canvas
  - should respect zoom level
```

#### 持久化测试

```typescript
describe('Persistence')
  - should auto-save to localStorage
  - should auto-save to IndexedDB
  - should restore on page reload
  - should export .bcanvas file
  - should import .bcanvas file
```

---

## 7. 风险与缓解

| 风险 | 影响程度 | 缓解措施 |
|------|---------|---------|
| MCP SDK 版本更新导致 API 变更 | **高** | 锁定版本号，封装适配层，升级前完整回归测试 |
| AI Agent 调用 Tool 参数错误 | **中** | 严格的 zod schema 校验 + 友好的中文错误提示 |
| 大量节点导致性能问题 | **中** | 虚拟滚动 + 增量快照 + 节点懒加载 |
| SSE 连接不稳定 | **低** | 自动重连机制 + 心跳检测 + 断线缓冲 |
| 浏览器截图环境差异 | **低** | Docker 固定 Chromium 版本 + 像素级回归测试 |
| React 版本升级兼容性 | **低** | 使用 React 18+ 稳定 API，避免实验性特性 |

---

## 8. 时间规划

| 版本 | 预计周期 | 关键里程碑 | 依赖 |
|------|---------|-----------|------|
| **v2.1.0** | 1-2 周 | 所有测试通过，ui 包可编译 | - |
| **v3.0.0** | 3-4 周 | MCP Server 可被 Claude Desktop 连接使用 | v2.1.0 |
| **v3.1.0** | 2-3 周 | Viewer 实时同步 + 截图反馈 | v3.0.0 |
| **v3.2.0** | 3-4 周 | 12+ 组件 + 插件系统 | v3.1.0 |

### 总体时间线

```
Week  1-2   ████████░░░░░░░░░░░░░░░░░░  v2.1.0 修复与稳定性
Week  3-6   ░░░░░░░░████████████░░░░░░  v3.0.0 MCP Server 核心
Week  7-9   ░░░░░░░░░░░░░░░░░░████░░░  v3.1.0 Viewer 实时联动
Week 10-13  ░░░░░░░░░░░░░░░░░░░░░████  v3.2.0 生态扩展
```

**预计总工期**：10-13 周（约 2.5-3 个月）

---

> **文档维护说明**：本文档应随项目进展持续更新。每个版本发布后，需回顾并更新"当前状态"和"已完成"部分。
