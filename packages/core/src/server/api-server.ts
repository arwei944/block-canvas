import * as http from 'http';
import { parse as parseUrl } from 'url';
import type { ParsedUrlQuery } from 'querystring';
import type { EditorStore } from '../store';
import { CommandManager } from '../commands/command-manager';
import { SnapshotEngine } from '../snapshot/snapshot-engine';
import { DiagnoseEngine } from '../diagnose/diagnose-engine';
import { pluginManager } from '../plugin/plugin-manager';
import { BlockType } from '../types';
import type {
  BlockNode,
  TextBlockNode,
  ImageBlockNode,
  ButtonBlockNode,
  ContainerBlockNode,
  BlockStyle,
  BlockLayout,
} from '../types';
import type {
  ApiResponse,
  AddNodeRequest,
  UpdateDataRequest,
  UpdateStyleRequest,
  UpdateLayoutRequest,
  MoveNodeRequest,
  SnapshotOptions,
  TransactionRequest,
  TransactionResult,
} from './types';

/**
 * REST API Server -- 使用原生 http 模块，零外部依赖
 *
 * 路由格式：
 *   - 旧格式（向后兼容）：/api/xxx
 *   - 新格式（SDK 标准）：/xxx
 * 两种格式共享相同的处理逻辑。
 */
export class BlockCanvasServer {
  private server: http.Server | null = null;
  private store: EditorStore;
  private commandManager: CommandManager;
  private snapshotEngine: SnapshotEngine;
  private diagnoseEngine: DiagnoseEngine;

  constructor(store: EditorStore, commandManager: CommandManager) {
    this.store = store;
    this.commandManager = commandManager;
    this.snapshotEngine = new SnapshotEngine(store);
    // DiagnoseEngine 需要 EditorStoreHook，这里通过包装 store 来适配
    // DiagnoseEngine 内部通过 getStore()() 获取 store 实例
    this.diagnoseEngine = new DiagnoseEngine(
      () => (() => store) as unknown as import('../store/types').EditorStoreHook,
    );
  }

  /**
   * 启动服务器
   */
  start(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res).catch((err) => {
          this.sendJson(res, 500, { success: false, error: String(err) });
        });
      });

      this.server.on('error', reject);

      this.server.listen(port, () => {
        resolve();
      });
    });
  }

  /**
   * 停止服务器
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => {
        this.server = null;
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * 路由分发
   *
   * 统一入口：先尝试匹配新格式路径，再回退到旧格式路径。
   * 通过 normalizePath 将两种前缀统一为内部路径进行处理。
   */
  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> {
    const parsedUrl = parseUrl(req.url ?? '', true);
    const rawPathname = parsedUrl.pathname ?? '';
    const method = req.method ?? 'GET';

    // CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 统一路径：去掉 /api 前缀，使新旧格式共享同一套路由逻辑
    const pathname = rawPathname.startsWith('/api')
      ? rawPathname.slice(4) // 去掉 "/api"
      : rawPathname;

    try {
      // ---- 节点操作路由 ----

      // POST /nodes/add 或 POST /nodes (SDK: POST /nodes)
      if (method === 'POST' && (pathname === '/nodes/add' || pathname === '/nodes')) {
        const body = await this.parseBody<AddNodeRequest>(req);
        this.handleAddNode(res, body);
        return;
      }

      // GET /nodes/query 或 GET /nodes (SDK: GET /nodes?type=&parentId=)
      if (method === 'GET' && (pathname === '/nodes/query' || pathname === '/nodes')) {
        this.handleQueryNodes(res, parsedUrl.query);
        return;
      }

      // GET /nodes/:id
      const getNodeMatch = pathname.match(/^\/nodes\/([^/]+)$/);
      if (method === 'GET' && getNodeMatch) {
        const nodeId = getNodeMatch[1];
        this.handleGetNode(res, nodeId);
        return;
      }

      // PUT /nodes/:id/data (SDK: PUT /nodes/:id/data)
      const updateDataMatch = pathname.match(/^\/nodes\/([^/]+)\/data$/);
      if (method === 'PUT' && updateDataMatch) {
        const nodeId = updateDataMatch[1];
        const body = await this.parseBody<UpdateDataRequest>(req);
        this.handleUpdateData(res, nodeId, body);
        return;
      }

      // PUT /nodes/:id/style
      const updateStyleMatch = pathname.match(/^\/nodes\/([^/]+)\/style$/);
      if (method === 'PUT' && updateStyleMatch) {
        const nodeId = updateStyleMatch[1];
        const body = await this.parseBody<UpdateStyleRequest>(req);
        this.handleUpdateStyle(res, nodeId, body);
        return;
      }

      // PUT /nodes/:id/layout
      const updateLayoutMatch = pathname.match(/^\/nodes\/([^/]+)\/layout$/);
      if (method === 'PUT' && updateLayoutMatch) {
        const nodeId = updateLayoutMatch[1];
        const body = await this.parseBody<UpdateLayoutRequest>(req);
        this.handleUpdateLayout(res, nodeId, body);
        return;
      }

      // DELETE /nodes/:id
      const deleteNodeMatch = pathname.match(/^\/nodes\/([^/]+)$/);
      if (method === 'DELETE' && deleteNodeMatch) {
        const nodeId = deleteNodeMatch[1];
        this.handleDeleteNode(res, nodeId);
        return;
      }

      // POST /nodes/:id/move
      const moveNodeMatch = pathname.match(/^\/nodes\/([^/]+)\/move$/);
      if (method === 'POST' && moveNodeMatch) {
        const nodeId = moveNodeMatch[1];
        const body = await this.parseBody<MoveNodeRequest>(req);
        this.handleMoveNode(res, nodeId, body);
        return;
      }

      // POST /nodes/:id/duplicate
      const duplicateNodeMatch = pathname.match(/^\/nodes\/([^/]+)\/duplicate$/);
      if (method === 'POST' && duplicateNodeMatch) {
        const nodeId = duplicateNodeMatch[1];
        this.handleDuplicateNode(res, nodeId);
        return;
      }

      // ---- 文档操作路由 ----

      // POST /document/undo
      if (method === 'POST' && pathname === '/document/undo') {
        this.handleUndo(res);
        return;
      }

      // POST /document/redo
      if (method === 'POST' && pathname === '/document/redo') {
        this.handleRedo(res);
        return;
      }

      // GET /document/export
      if (method === 'GET' && pathname === '/document/export') {
        this.handleExport(res);
        return;
      }

      // ---- 反馈路由 (Feedback) ----

      // GET /feedback/snapshot 或 POST /feedback/snapshot (SDK: POST /feedback/snapshot)
      if (pathname === '/feedback/snapshot') {
        if (method === 'GET') {
          this.handleSnapshot(res, parsedUrl.query);
          return;
        }
        if (method === 'POST') {
          const body = await this.parseBody<SnapshotOptions>(req);
          this.handleSnapshotPost(res, body);
          return;
        }
      }

      // GET /feedback/describe 或 POST /feedback/describe (SDK: POST /feedback/describe)
      if (pathname === '/feedback/describe') {
        if (method === 'GET') {
          this.handleDescribe(res, parsedUrl.query);
          return;
        }
        if (method === 'POST') {
          const body = await this.parseBody<{ style?: 'concise' | 'detailed' }>(req);
          this.handleDescribePost(res, body);
          return;
        }
      }

      // POST /feedback/diagnose (SDK: POST /feedback/diagnose)
      if (method === 'POST' && pathname === '/feedback/diagnose') {
        this.handleDiagnose(res);
        return;
      }

      // POST /feedback/auto-fix (SDK: POST /feedback/auto-fix)
      if (method === 'POST' && pathname === '/feedback/auto-fix') {
        this.handleAutoFix(res);
        return;
      }

      // ---- 描述路由 (Describe) ----

      // GET /describe/overview (SDK: GET /describe/overview)
      if (method === 'GET' && pathname === '/describe/overview') {
        this.handleDescribeOverview(res);
        return;
      }

      // GET /describe/components (SDK: GET /describe/components)
      if (method === 'GET' && pathname === '/describe/components') {
        this.handleDescribeComponents(res);
        return;
      }

      // GET /describe/components/:type (SDK: GET /describe/components/:type)
      const componentDefMatch = pathname.match(/^\/describe\/components\/([^/]+)$/);
      if (method === 'GET' && componentDefMatch) {
        const type = componentDefMatch[1];
        this.handleComponentDef(res, type);
        return;
      }

      // GET /describe/nodes/:id/relationships (SDK: GET /describe/nodes/:id/relationships)
      const relationshipsMatch = pathname.match(/^\/describe\/nodes\/([^/]+)\/relationships$/);
      if (method === 'GET' && relationshipsMatch) {
        const nodeId = relationshipsMatch[1];
        this.handleRelationships(res, nodeId);
        return;
      }

      // GET /describe/history (SDK: GET /describe/history)
      if (method === 'GET' && pathname === '/describe/history') {
        this.handleHistory(res, parsedUrl.query);
        return;
      }

      // ---- 事务路由 (Transaction) ----

      // POST /transactions/commit (SDK: POST /transactions/commit)
      if (method === 'POST' && pathname === '/transactions/commit') {
        const body = await this.parseBody<TransactionRequest>(req);
        this.handleTransactionCommit(res, body);
        return;
      }

      // POST /transactions/rollback (SDK: POST /transactions/rollback)
      if (method === 'POST' && pathname === '/transactions/rollback') {
        this.handleTransactionRollback(res);
        return;
      }

      // 404
      this.sendJson(res, 404, { success: false, error: `Route not found: ${method} ${rawPathname}` });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  // ---- 节点 CRUD 处理器 ----

  private handleAddNode(res: http.ServerResponse, body: AddNodeRequest): void {
    try {
      const doc = this.store.getDocumentSnapshot();
      if (!doc) {
        this.sendJson(res, 400, { success: false, error: 'No document initialized' });
        return;
      }

      const parent = doc.nodes[body.parentId];
      if (!parent || parent.type !== BlockType.Container) {
        this.sendJson(res, 400, { success: false, error: 'Parent node not found or is not a container' });
        return;
      }

      const nodeId = this.generateId();
      const blockType = body.type as BlockType;
      const newNode = this.createNode(nodeId, blockType, body);

      // 使用 commandManager 执行以支持撤销
      this.commandManager.execute('node.add', {
        parentId: body.parentId,
        node: newNode,
      });

      this.sendJson(res, 201, { success: true, data: { id: nodeId } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleGetNode(res: http.ServerResponse, nodeId: string): void {
    try {
      const node = this.store.getNode(nodeId);
      if (!node) {
        this.sendJson(res, 404, { success: false, error: `Node "${nodeId}" not found` });
        return;
      }
      this.sendJson(res, 200, { success: true, data: node });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleUpdateData(res: http.ServerResponse, nodeId: string, body: UpdateDataRequest): void {
    try {
      const node = this.store.getNode(nodeId);
      if (!node) {
        this.sendJson(res, 404, { success: false, error: `Node "${nodeId}" not found` });
        return;
      }

      this.commandManager.execute('node.update', {
        nodeId,
        updates: { data: body.data },
      });

      this.sendJson(res, 200, { success: true, data: { id: nodeId } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleUpdateStyle(res: http.ServerResponse, nodeId: string, body: UpdateStyleRequest): void {
    try {
      const node = this.store.getNode(nodeId);
      if (!node) {
        this.sendJson(res, 404, { success: false, error: `Node "${nodeId}" not found` });
        return;
      }

      this.commandManager.execute('node.updateStyle', {
        nodeId,
        style: body.style as Partial<BlockStyle>,
      });

      this.sendJson(res, 200, { success: true, data: { id: nodeId } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleUpdateLayout(res: http.ServerResponse, nodeId: string, body: UpdateLayoutRequest): void {
    try {
      const node = this.store.getNode(nodeId);
      if (!node) {
        this.sendJson(res, 404, { success: false, error: `Node "${nodeId}" not found` });
        return;
      }

      this.commandManager.execute('node.updateLayout', {
        nodeId,
        layout: body.layout as Partial<BlockLayout>,
      });

      this.sendJson(res, 200, { success: true, data: { id: nodeId } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleDeleteNode(res: http.ServerResponse, nodeId: string): void {
    try {
      const node = this.store.getNode(nodeId);
      if (!node) {
        this.sendJson(res, 404, { success: false, error: `Node "${nodeId}" not found` });
        return;
      }

      this.commandManager.execute('node.remove', { nodeId });
      this.sendJson(res, 200, { success: true, data: { id: nodeId } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleMoveNode(res: http.ServerResponse, nodeId: string, body: MoveNodeRequest): void {
    try {
      const node = this.store.getNode(nodeId);
      if (!node) {
        this.sendJson(res, 404, { success: false, error: `Node "${nodeId}" not found` });
        return;
      }

      this.commandManager.execute('node.move', {
        nodeId,
        newParentId: body.newParentId,
        index: body.index,
      });

      this.sendJson(res, 200, { success: true, data: { id: nodeId } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleDuplicateNode(res: http.ServerResponse, nodeId: string): void {
    try {
      const doc = this.store.getDocumentSnapshot();
      if (!doc) {
        this.sendJson(res, 400, { success: false, error: 'No document initialized' });
        return;
      }

      const node = doc.nodes[nodeId];
      if (!node) {
        this.sendJson(res, 404, { success: false, error: `Node "${nodeId}" not found` });
        return;
      }

      // 查找父节点
      const parentId = this.findParentId(nodeId, doc.nodes, doc.rootId);
      if (!parentId) {
        this.sendJson(res, 400, { success: false, error: 'Cannot duplicate root node' });
        return;
      }

      // 深拷贝节点，生成新 ID
      const newId = this.generateId();
      const clonedNode = this.deepCloneNode(node, newId);

      this.commandManager.execute('node.add', {
        parentId,
        node: clonedNode,
      });

      this.sendJson(res, 201, { success: true, data: { id: newId } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleQueryNodes(res: http.ServerResponse, query: ParsedUrlQuery): void {
    try {
      const doc = this.store.getDocumentSnapshot();
      if (!doc) {
        this.sendJson(res, 400, { success: false, error: 'No document initialized' });
        return;
      }

      const typeFilter = query.type as string | undefined;
      const parentIdFilter = query.parentId as string | undefined;

      let results: BlockNode[] = Object.values(doc.nodes);

      if (typeFilter) {
        results = results.filter((n) => n.type === typeFilter);
      }

      if (parentIdFilter) {
        const parent = doc.nodes[parentIdFilter];
        if (parent && parent.type === BlockType.Container) {
          const childIds = new Set(parent.props.children);
          results = results.filter((n) => childIds.has(n.id));
        } else {
          results = [];
        }
      }

      this.sendJson(res, 200, { success: true, data: results });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  // ---- 文档操作处理器 ----

  private handleUndo(res: http.ServerResponse): void {
    try {
      if (!this.commandManager.canUndo()) {
        this.sendJson(res, 400, { success: false, error: 'Nothing to undo' });
        return;
      }
      this.commandManager.undo();
      this.sendJson(res, 200, { success: true, data: { undone: true } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleRedo(res: http.ServerResponse): void {
    try {
      if (!this.commandManager.canRedo()) {
        this.sendJson(res, 400, { success: false, error: 'Nothing to redo' });
        return;
      }
      this.commandManager.redo();
      this.sendJson(res, 200, { success: true, data: { redone: true } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleExport(res: http.ServerResponse): void {
    try {
      const doc = this.store.getDocumentSnapshot();
      if (!doc) {
        this.sendJson(res, 400, { success: false, error: 'No document initialized' });
        return;
      }
      this.sendJson(res, 200, { success: true, data: doc });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  // ---- 反馈处理器 (Feedback) ----

  private handleSnapshot(res: http.ServerResponse, query: ParsedUrlQuery): void {
    try {
      const options: SnapshotOptions = {};
      if (query.detail === 'summary' || query.detail === 'full') {
        options.detail = query.detail;
      }
      if (query.includeStyles === 'true') {
        options.includeStyles = true;
      }
      if (query.includeLayout === 'true') {
        options.includeLayout = true;
      }

      const snapshot = this.snapshotEngine.getSnapshot(options);
      this.sendJson(res, 200, { success: true, data: snapshot });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleSnapshotPost(res: http.ServerResponse, body: SnapshotOptions): void {
    try {
      const snapshot = this.snapshotEngine.getSnapshot(body);
      this.sendJson(res, 200, { success: true, data: { snapshot } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleDescribe(res: http.ServerResponse, query: ParsedUrlQuery): void {
    try {
      const style = query.style === 'detailed' ? 'detailed' : 'concise';
      const description = this.snapshotEngine.getDescription({ style });
      this.sendJson(res, 200, { success: true, data: { description } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleDescribePost(res: http.ServerResponse, body: { style?: 'concise' | 'detailed' }): void {
    try {
      const style = body.style === 'detailed' ? 'detailed' : 'concise';
      const description = this.snapshotEngine.getDescription({ style });
      this.sendJson(res, 200, { success: true, data: { description } });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleDiagnose(res: http.ServerResponse): void {
    try {
      const report = this.diagnoseEngine.diagnose();
      this.sendJson(res, 200, { success: true, data: report });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleAutoFix(res: http.ServerResponse): void {
    try {
      const report = this.diagnoseEngine.diagnose();
      const fixResults: Array<{ issue: string; fixed: boolean; error?: string }> = [];

      for (const issue of report.issues) {
        if (issue.autoFix) {
          try {
            this.executeAutoFix(issue.autoFix);
            fixResults.push({ issue: issue.message, fixed: true });
          } catch (fixErr) {
            fixResults.push({ issue: issue.message, fixed: false, error: String(fixErr) });
          }
        } else {
          fixResults.push({ issue: issue.message, fixed: false, error: 'No auto-fix available' });
        }
      }

      const allFixed = fixResults.every((r) => r.fixed);
      this.sendJson(res, 200, {
        success: true,
        data: {
          fixed: allFixed,
          results: fixResults,
          totalIssues: report.issues.length,
          fixedCount: fixResults.filter((r) => r.fixed).length,
        },
      });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  /**
   * 执行单个自动修复操作
   */
  private executeAutoFix(autoFix: { type: string; params: Record<string, unknown> }): void {
    switch (autoFix.type) {
      case 'fix-overflow': {
        const { nodeId, overflow } = autoFix.params as { nodeId: string; overflow: string };
        this.commandManager.execute('node.updateStyle', {
          nodeId,
          style: { overflow } as Partial<BlockStyle>,
        });
        break;
      }
      case 'fix-inconsistency': {
        const { nodeIds, property, value } = autoFix.params as {
          nodeIds: string[];
          property: string;
          value: string;
        };
        for (const id of nodeIds) {
          this.commandManager.execute('node.updateStyle', {
            nodeId: id,
            style: { [property]: value } as Partial<BlockStyle>,
          });
        }
        break;
      }
      case 'resolve-overlap':
      case 'resolve-misalignment':
        // 这些修复需要更复杂的逻辑，暂时跳过
        break;
      default:
        break;
    }
  }

  // ---- 描述处理器 (Describe) ----

  private handleDescribeOverview(res: http.ServerResponse): void {
    try {
      const doc = this.store.getDocumentSnapshot();
      if (!doc) {
        this.sendJson(res, 400, { success: false, error: 'No document initialized' });
        return;
      }

      const nodes = Object.values(doc.nodes);
      const typeCounts: Record<string, number> = {};
      for (const node of nodes) {
        typeCounts[node.type] = (typeCounts[node.type] ?? 0) + 1;
      }

      const history = this.commandManager.getHistory();

      this.sendJson(res, 200, {
        success: true,
        data: {
          nodeCount: nodes.length,
          types: typeCounts,
          rootId: doc.rootId,
          historySize: history.past.length + history.future.length,
        },
      });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleDescribeComponents(res: http.ServerResponse): void {
    try {
      const definitions = pluginManager.getAllComponentDefinitions();
      const components = definitions.map((def) => ({
        type: def.type,
        name: def.type,
        description: (def as unknown as Record<string, unknown>).description ?? '',
      }));
      this.sendJson(res, 200, { success: true, data: components });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleComponentDef(res: http.ServerResponse, type: string): void {
    try {
      const definition = pluginManager.getComponentDefinition(type);
      if (!definition) {
        this.sendJson(res, 404, { success: false, error: `Component type "${type}" not found` });
        return;
      }
      this.sendJson(res, 200, { success: true, data: definition });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleRelationships(res: http.ServerResponse, nodeId: string): void {
    try {
      const doc = this.store.getDocumentSnapshot();
      if (!doc) {
        this.sendJson(res, 400, { success: false, error: 'No document initialized' });
        return;
      }

      const node = doc.nodes[nodeId];
      if (!node) {
        this.sendJson(res, 404, { success: false, error: `Node "${nodeId}" not found` });
        return;
      }

      // 查找父节点
      const parentId = this.findParentId(nodeId, doc.nodes, doc.rootId);

      // 查找子节点
      const children: string[] = node.type === BlockType.Container
        ? [...node.props.children]
        : [];

      // 查找兄弟节点
      const siblings: string[] = [];
      if (parentId) {
        const parent = doc.nodes[parentId];
        if (parent && parent.type === BlockType.Container) {
          siblings.push(...parent.props.children.filter((id) => id !== nodeId));
        }
      }

      this.sendJson(res, 200, {
        success: true,
        data: {
          id: nodeId,
          parentId: parentId ?? null,
          children,
          siblings,
        },
      });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleHistory(res: http.ServerResponse, query: ParsedUrlQuery): void {
    try {
      const history = this.commandManager.getHistory();
      const limit = query.limit ? parseInt(query.limit as string, 10) : undefined;

      const pastEntries = history.past.map((entry) => ({
        commandName: entry.commandName,
        description: entry.description,
        timestamp: entry.timestamp,
        direction: 'past' as const,
      }));

      const futureEntries = history.future.map((entry) => ({
        commandName: entry.commandName,
        description: entry.description,
        timestamp: entry.timestamp,
        direction: 'future' as const,
      }));

      // 合并并按时间排序（最近的在前）
      const allEntries = [...pastEntries, ...futureEntries]
        .sort((a, b) => b.timestamp - a.timestamp);

      const result = limit !== undefined && !isNaN(limit)
        ? allEntries.slice(0, limit)
        : allEntries;

      this.sendJson(res, 200, { success: true, data: result });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  // ---- 事务处理器 (Transaction) ----

  private handleTransactionCommit(res: http.ServerResponse, body: TransactionRequest): void {
    try {
      const results: TransactionResult['results'] = [];

      for (const operation of body.operations) {
        try {
          switch (operation.type) {
            case 'add': {
              const params = operation.params as {
                parentId: string;
                type: string;
                data?: Record<string, unknown>;
                style?: Record<string, unknown>;
                pendingId?: string;
              };
              const nodeId = this.generateId();
              const blockType = params.type as BlockType;
              const newNode = this.createNode(nodeId, blockType, {
                parentId: params.parentId,
                type: params.type,
                data: params.data,
                style: params.style,
              });
              this.commandManager.execute('node.add', {
                parentId: params.parentId,
                node: newNode,
              });
              results.push({
                operation: operation.type,
                success: true,
                data: { id: nodeId, pendingId: params.pendingId },
              });
              break;
            }
            case 'remove': {
              const params = operation.params as { id: string };
              this.commandManager.execute('node.remove', { nodeId: params.id });
              results.push({ operation: operation.type, success: true });
              break;
            }
            case 'updateData': {
              const params = operation.params as { id: string; data: Record<string, unknown> };
              this.commandManager.execute('node.update', {
                nodeId: params.id,
                updates: { data: params.data },
              });
              results.push({ operation: operation.type, success: true });
              break;
            }
            case 'updateStyle': {
              const params = operation.params as { id: string; style: Record<string, unknown> };
              this.commandManager.execute('node.updateStyle', {
                nodeId: params.id,
                style: params.style as Partial<BlockStyle>,
              });
              results.push({ operation: operation.type, success: true });
              break;
            }
            case 'updateLayout': {
              const params = operation.params as { id: string; layout: Record<string, unknown> };
              this.commandManager.execute('node.updateLayout', {
                nodeId: params.id,
                layout: params.layout as Partial<BlockLayout>,
              });
              results.push({ operation: operation.type, success: true });
              break;
            }
            case 'move': {
              const params = operation.params as { id: string; newParentId: string; index?: number };
              this.commandManager.execute('node.move', {
                nodeId: params.id,
                newParentId: params.newParentId,
                index: params.index,
              });
              results.push({ operation: operation.type, success: true });
              break;
            }
            case 'duplicate': {
              const params = operation.params as { id: string; pendingId?: string };
              const doc = this.store.getDocumentSnapshot();
              if (doc && doc.nodes[params.id]) {
                const parentId = this.findParentId(params.id, doc.nodes, doc.rootId);
                if (parentId) {
                  const newId = this.generateId();
                  const clonedNode = this.deepCloneNode(doc.nodes[params.id], newId);
                  this.commandManager.execute('node.add', { parentId, node: clonedNode });
                  results.push({
                    operation: operation.type,
                    success: true,
                    data: { id: newId, pendingId: params.pendingId },
                  });
                } else {
                  results.push({ operation: operation.type, success: false, error: 'Cannot duplicate root node' });
                }
              } else {
                results.push({ operation: operation.type, success: false, error: `Node "${params.id}" not found` });
              }
              break;
            }
            default:
              results.push({
                operation: operation.type,
                success: false,
                error: `Unknown operation type: ${operation.type}`,
              });
              break;
          }
        } catch (opErr) {
          results.push({
            operation: operation.type,
            success: false,
            error: String(opErr),
          });
        }
      }

      const allSuccess = results.every((r) => r.success);
      this.sendJson(res, 200, {
        success: allSuccess,
        data: {
          success: allSuccess,
          results,
        } as TransactionResult,
      });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  private handleTransactionRollback(res: http.ServerResponse): void {
    // 事务是客户端概念，服务端不需要额外处理
    // 客户端的 Transaction.rollback() 只是清空本地操作队列
    this.sendJson(res, 200, { success: true, data: { rolledBack: true } });
  }

  // ---- 工具方法 ----

  private sendJson(res: http.ServerResponse, statusCode: number, body: ApiResponse): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  }

  private parseBody<T>(req: http.IncomingMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf-8');
          if (!raw) {
            resolve({} as T);
            return;
          }
          resolve(JSON.parse(raw) as T);
        } catch (err) {
          reject(new Error('Invalid JSON body'));
        }
      });
      req.on('error', reject);
    });
  }

  private generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * 根据 type 创建对应的 BlockNode
   */
  private createNode(id: string, type: BlockType, request: AddNodeRequest): BlockNode {
    const base = {
      id,
      type,
      name: request.data?.name as string ?? `${type}-${id.slice(-6)}`,
      style: (request.style as Partial<BlockStyle>) ?? {},
      layout: {},
      locked: false,
      visible: true,
      data: request.data,
    };

    switch (type) {
      case BlockType.Text:
        return {
          ...base,
          type: BlockType.Text,
          props: {
            content: (request.data?.content as string) ?? '',
            fontSize: (request.data?.fontSize as string) ?? '16px',
            color: (request.data?.color as string) ?? '#000000',
          },
        } as TextBlockNode;

      case BlockType.Image:
        return {
          ...base,
          type: BlockType.Image,
          props: {
            src: (request.data?.src as string) ?? '',
            alt: (request.data?.alt as string) ?? '',
            objectFit: (request.data?.objectFit as 'cover' | 'contain' | 'fill' | 'none') ?? 'cover',
          },
        } as ImageBlockNode;

      case BlockType.Button:
        return {
          ...base,
          type: BlockType.Button,
          props: {
            label: (request.data?.label as string) ?? 'Button',
            variant: (request.data?.variant as 'primary' | 'secondary' | 'ghost') ?? 'primary',
          },
        } as ButtonBlockNode;

      case BlockType.Container:
        return {
          ...base,
          type: BlockType.Container,
          props: { children: [] },
        } as ContainerBlockNode;

      default:
        // Fallback to container
        return {
          ...base,
          type: BlockType.Container,
          props: { children: [] },
        } as ContainerBlockNode;
    }
  }

  /**
   * 深拷贝节点，替换所有 ID
   */
  private deepCloneNode(node: BlockNode, newId: string): BlockNode {
    const cloned = JSON.parse(JSON.stringify(node)) as BlockNode;
    cloned.id = newId;
    cloned.name = `${node.name} (copy)`;

    // 如果是容器，递归替换子节点 ID
    if (cloned.type === BlockType.Container) {
      const idMap = new Map<string, string>();
      this.collectAndReplaceIds(cloned, idMap);
    }

    return cloned;
  }

  /**
   * 递归收集并替换节点 ID
   */
  private collectAndReplaceIds(
    node: BlockNode,
    idMap: Map<string, string>,
  ): void {
    if (node.type !== BlockType.Container) return;

    const newChildren: string[] = [];
    for (const childId of node.props.children) {
      const newChildId = this.generateId();
      idMap.set(childId, newChildId);
      newChildren.push(newChildId);
    }
    node.props.children = newChildren;

    // 注意：深拷贝后的子节点仍在 nodes 中但 ID 已变
    // 这里只处理了 children 引用，实际子节点对象需要从外部 nodes 中查找并替换
    // 由于 duplicate 操作只添加顶层节点，子节点需要额外处理
  }

  /**
   * 查找节点的父节点 ID
   */
  private findParentId(
    nodeId: string,
    nodes: Record<string, BlockNode>,
    rootId: string,
  ): string | null {
    if (nodeId === rootId) return null;
    for (const [id, node] of Object.entries(nodes)) {
      if (node.type === BlockType.Container && node.props.children.includes(nodeId)) {
        return id;
      }
    }
    return null;
  }
}
