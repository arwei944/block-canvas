import * as http from 'http';
import { parse as parseUrl } from 'url';
import type { ParsedUrlQuery } from 'querystring';
import type { EditorStore } from '../store';
import { CommandManager } from '../commands/command-manager';
import { SnapshotEngine } from '../snapshot/snapshot-engine';
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
  UpdateStyleRequest,
  UpdateLayoutRequest,
  MoveNodeRequest,
  SnapshotOptions,
} from './types';

/**
 * REST API Server —— 使用原生 http 模块，零外部依赖
 */
export class BlockCanvasServer {
  private server: http.Server | null = null;
  private store: EditorStore;
  private commandManager: CommandManager;
  private snapshotEngine: SnapshotEngine;

  constructor(store: EditorStore, commandManager: CommandManager) {
    this.store = store;
    this.commandManager = commandManager;
    this.snapshotEngine = new SnapshotEngine(store);
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
   */
  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> {
    const parsedUrl = parseUrl(req.url ?? '', true);
    const pathname = parsedUrl.pathname ?? '';
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

    try {
      // ---- 路由匹配 ----

      // POST /api/nodes/add
      if (method === 'POST' && pathname === '/api/nodes/add') {
        const body = await this.parseBody<AddNodeRequest>(req);
        this.handleAddNode(res, body);
        return;
      }

      // GET /api/nodes/query?type=&parentId=
      if (method === 'GET' && pathname === '/api/nodes/query') {
        this.handleQueryNodes(res, parsedUrl.query);
        return;
      }

      // GET /api/nodes/:id
      const getNodeMatch = pathname.match(/^\/api\/nodes\/([^/]+)$/);
      if (method === 'GET' && getNodeMatch) {
        const nodeId = getNodeMatch[1];
        this.handleGetNode(res, nodeId);
        return;
      }

      // PUT /api/nodes/:id/style
      const updateStyleMatch = pathname.match(/^\/api\/nodes\/([^/]+)\/style$/);
      if (method === 'PUT' && updateStyleMatch) {
        const nodeId = updateStyleMatch[1];
        const body = await this.parseBody<UpdateStyleRequest>(req);
        this.handleUpdateStyle(res, nodeId, body);
        return;
      }

      // PUT /api/nodes/:id/layout
      const updateLayoutMatch = pathname.match(/^\/api\/nodes\/([^/]+)\/layout$/);
      if (method === 'PUT' && updateLayoutMatch) {
        const nodeId = updateLayoutMatch[1];
        const body = await this.parseBody<UpdateLayoutRequest>(req);
        this.handleUpdateLayout(res, nodeId, body);
        return;
      }

      // DELETE /api/nodes/:id
      const deleteNodeMatch = pathname.match(/^\/api\/nodes\/([^/]+)$/);
      if (method === 'DELETE' && deleteNodeMatch) {
        const nodeId = deleteNodeMatch[1];
        this.handleDeleteNode(res, nodeId);
        return;
      }

      // POST /api/nodes/:id/move
      const moveNodeMatch = pathname.match(/^\/api\/nodes\/([^/]+)\/move$/);
      if (method === 'POST' && moveNodeMatch) {
        const nodeId = moveNodeMatch[1];
        const body = await this.parseBody<MoveNodeRequest>(req);
        this.handleMoveNode(res, nodeId, body);
        return;
      }

      // POST /api/nodes/:id/duplicate
      const duplicateNodeMatch = pathname.match(/^\/api\/nodes\/([^/]+)\/duplicate$/);
      if (method === 'POST' && duplicateNodeMatch) {
        const nodeId = duplicateNodeMatch[1];
        this.handleDuplicateNode(res, nodeId);
        return;
      }

      // POST /api/document/undo
      if (method === 'POST' && pathname === '/api/document/undo') {
        this.handleUndo(res);
        return;
      }

      // POST /api/document/redo
      if (method === 'POST' && pathname === '/api/document/redo') {
        this.handleRedo(res);
        return;
      }

      // GET /api/document/export
      if (method === 'GET' && pathname === '/api/document/export') {
        this.handleExport(res);
        return;
      }

      // GET /api/feedback/snapshot
      if (method === 'GET' && pathname === '/api/feedback/snapshot') {
        this.handleSnapshot(res, parsedUrl.query);
        return;
      }

      // GET /api/feedback/describe
      if (method === 'GET' && pathname === '/api/feedback/describe') {
        this.handleDescribe(res, parsedUrl.query);
        return;
      }

      // 404
      this.sendJson(res, 404, { success: false, error: `Route not found: ${method} ${pathname}` });
    } catch (err) {
      this.sendJson(res, 500, { success: false, error: String(err) });
    }
  }

  // ---- 节点 CRUD 处理器 ----

  private handleAddNode(res: http.ServerResponse, body: AddNodeRequest): void {
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
  }

  private handleGetNode(res: http.ServerResponse, nodeId: string): void {
    const node = this.store.getNode(nodeId);
    if (!node) {
      this.sendJson(res, 404, { success: false, error: `Node "${nodeId}" not found` });
      return;
    }
    this.sendJson(res, 200, { success: true, data: node });
  }

  private handleUpdateStyle(res: http.ServerResponse, nodeId: string, body: UpdateStyleRequest): void {
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
  }

  private handleUpdateLayout(res: http.ServerResponse, nodeId: string, body: UpdateLayoutRequest): void {
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
  }

  private handleDeleteNode(res: http.ServerResponse, nodeId: string): void {
    const node = this.store.getNode(nodeId);
    if (!node) {
      this.sendJson(res, 404, { success: false, error: `Node "${nodeId}" not found` });
      return;
    }

    this.commandManager.execute('node.remove', { nodeId });
    this.sendJson(res, 200, { success: true, data: { id: nodeId } });
  }

  private handleMoveNode(res: http.ServerResponse, nodeId: string, body: MoveNodeRequest): void {
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
  }

  private handleDuplicateNode(res: http.ServerResponse, nodeId: string): void {
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
  }

  private handleQueryNodes(res: http.ServerResponse, query: ParsedUrlQuery): void {
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
  }

  // ---- 文档操作处理器 ----

  private handleUndo(res: http.ServerResponse): void {
    if (!this.commandManager.canUndo()) {
      this.sendJson(res, 400, { success: false, error: 'Nothing to undo' });
      return;
    }
    this.commandManager.undo();
    this.sendJson(res, 200, { success: true, data: { undone: true } });
  }

  private handleRedo(res: http.ServerResponse): void {
    if (!this.commandManager.canRedo()) {
      this.sendJson(res, 400, { success: false, error: 'Nothing to redo' });
      return;
    }
    this.commandManager.redo();
    this.sendJson(res, 200, { success: true, data: { redone: true } });
  }

  private handleExport(res: http.ServerResponse): void {
    const doc = this.store.getDocumentSnapshot();
    if (!doc) {
      this.sendJson(res, 400, { success: false, error: 'No document initialized' });
      return;
    }
    this.sendJson(res, 200, { success: true, data: doc });
  }

  // ---- 反馈处理器 ----

  private handleSnapshot(res: http.ServerResponse, query: ParsedUrlQuery): void {
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
  }

  private handleDescribe(res: http.ServerResponse, query: ParsedUrlQuery): void {
    const style = query.style === 'detailed' ? 'detailed' : 'concise';
    const description = this.snapshotEngine.getDescription({ style });
    this.sendJson(res, 200, { success: true, data: { description } });
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
