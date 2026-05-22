import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { useEditorStore, createTextBlock, createImageBlock, createButtonBlock, createContainerBlock, generateBlockId, BlockType } from '@block-canvas/core';
import type { BlockNode, BlockStyle, BlockLayout } from '@block-canvas/core';

/**
 * 正则匹配 pending 引用: <pending:someKey>
 */
const PENDING_REF_REGEX = /^<pending:(.+)>$/;

/**
 * 解析参数值中的 pending 引用，替换为之前操作产生的实际值
 */
function resolvePendingRefs(
  params: Record<string, unknown>,
  pendingIds: Record<string, string>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      const match = value.match(PENDING_REF_REGEX);
      if (match) {
        const refKey = match[1];
        if (pendingIds[refKey] !== undefined) {
          resolved[key] = pendingIds[refKey];
          continue;
        }
      }
    }
    // 递归处理嵌套对象
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      resolved[key] = resolvePendingRefs(
        value as Record<string, unknown>,
        pendingIds,
      );
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

/**
 * 注册事务工具
 *
 * 提供原子化批量操作能力，支持 add_node、update_style、update_layout、remove_node、move_node，
 * 以及操作间的 pending ID 引用解析。
 */
export function registerTransactionTool(server: McpServer) {
  server.tool(
    'execute_transaction',
    'Execute multiple operations atomically in a single transaction. Supports add_node, update_style, update_layout, remove_node, and move_node operations. Use pendingIds to reference node IDs created by earlier operations in the same transaction via <pending:key> syntax.',
    {
      operations: z
        .array(
          z.object({
            type: z
              .enum([
                'add_node',
                'update_style',
                'update_layout',
                'remove_node',
                'move_node',
              ])
              .describe('Operation type.'),
            params: z
              .record(z.unknown())
              .describe('Operation parameters (specific to each operation type).'),
          }),
        )
        .min(1)
        .describe('Array of operations to execute in order.'),
      pendingIds: z
        .record(z.string(), z.string())
        .optional()
        .default({})
        .describe(
          'Map of pending ID keys to actual node IDs. Use <pending:key> in operation params to reference these. Keys from add_node results (using "id" field) are automatically added.',
        ),
    },
    async ({ operations, pendingIds: initialPendingIds }) => {
      const store = useEditorStore.getState();
      const doc = store.getDocumentSnapshot();

      if (!doc) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: 'No document is currently open.',
              }),
            },
          ],
          isError: true,
        };
      }

      // Working copy of pending ID mappings (mutable across operations)
      const resolvedPendingIds: Record<string, string> = {
        ...initialPendingIds,
      };

      const results: Array<{
        operation: string;
        success: boolean;
        nodeId?: string;
        error?: string;
      }> = [];

      for (const op of operations) {
        try {
          // Resolve any <pending:...> references in params
          const params = resolvePendingRefs(op.params, resolvedPendingIds);

          switch (op.type) {
            case 'add_node': {
              const parentId = params.parentId as string;
              const nodeType = params.type as string;
              const data = params.data as Record<string, unknown> | undefined;
              const style = params.style as Partial<BlockStyle> | undefined;
              const layout = params.layout as Partial<BlockLayout> | undefined;
              const index = params.index as number | undefined;
              const pendingKey = params.pendingKey as string | undefined;

              if (!parentId) {
                throw new Error('add_node requires "parentId" in params.');
              }

              const parentNode = doc.nodes[parentId];
              if (!parentNode || parentNode.type !== BlockType.Container) {
                throw new Error(
                  `Parent node "${parentId}" is not a valid container.`,
                );
              }

              let newNode: BlockNode;
              const overrides: Record<string, unknown> = {
                style: style ?? {},
                layout: layout ?? {},
                data: data,
              };

              switch (nodeType) {
                case BlockType.Text:
                case 'text': {
                  const content = (data?.content as string) ?? '';
                  const textOverrides: Record<string, unknown> = {
                    ...overrides,
                    props: {
                      content,
                      fontSize: data?.fontSize,
                      fontWeight: data?.fontWeight,
                      color: data?.color,
                      textAlign: data?.textAlign,
                      lineHeight: data?.lineHeight,
                      fontFamily: data?.fontFamily,
                    },
                  };
                  newNode = createTextBlock(content, textOverrides);
                  break;
                }
                case BlockType.Image:
                case 'image': {
                  const src = (data?.src as string) ?? '';
                  const imageOverrides: Record<string, unknown> = {
                    ...overrides,
                    props: {
                      src,
                      alt: data?.alt,
                      objectFit: data?.objectFit,
                    },
                  };
                  newNode = createImageBlock(src, imageOverrides);
                  break;
                }
                case BlockType.Button:
                case 'button': {
                  const label = (data?.label as string) ?? '';
                  const buttonOverrides: Record<string, unknown> = {
                    ...overrides,
                    props: {
                      label,
                      href: data?.href,
                      variant: data?.variant,
                    },
                  };
                  newNode = createButtonBlock(label, buttonOverrides);
                  break;
                }
                case BlockType.Container:
                case 'container':
                default: {
                  newNode = createContainerBlock([], overrides);
                  break;
                }
              }

              store.addNode(parentId, newNode);

              // If there is a pendingKey, register the generated ID
              if (pendingKey) {
                resolvedPendingIds[pendingKey] = newNode.id;
              }

              results.push({
                operation: 'add_node',
                success: true,
                nodeId: newNode.id,
              });
              break;
            }

            case 'update_style': {
              const nodeId = params.nodeId as string;
              const style = params.style as Partial<BlockStyle>;

              if (!nodeId) {
                throw new Error(
                  'update_style requires "nodeId" in params.',
                );
              }
              if (!style || typeof style !== 'object') {
                throw new Error(
                  'update_style requires a "style" object in params.',
                );
              }

              store.updateNodeStyle(nodeId, style);
              results.push({
                operation: 'update_style',
                success: true,
                nodeId,
              });
              break;
            }

            case 'update_layout': {
              const nodeId = params.nodeId as string;
              const layout = params.layout as Partial<BlockLayout>;

              if (!nodeId) {
                throw new Error(
                  'update_layout requires "nodeId" in params.',
                );
              }
              if (!layout || typeof layout !== 'object') {
                throw new Error(
                  'update_layout requires a "layout" object in params.',
                );
              }

              store.updateNodeLayout(nodeId, layout);
              results.push({
                operation: 'update_layout',
                success: true,
                nodeId,
              });
              break;
            }

            case 'remove_node': {
              const nodeId = params.nodeId as string;

              if (!nodeId) {
                throw new Error(
                  'remove_node requires "nodeId" in params.',
                );
              }

              store.removeNode(nodeId);
              results.push({
                operation: 'remove_node',
                success: true,
                nodeId,
              });
              break;
            }

            case 'move_node': {
              const nodeId = params.nodeId as string;
              const newParentId = params.newParentId as string;
              const index = params.index as number | undefined;

              if (!nodeId) {
                throw new Error(
                  'move_node requires "nodeId" in params.',
                );
              }
              if (!newParentId) {
                throw new Error(
                  'move_node requires "newParentId" in params.',
                );
              }

              store.moveNode(nodeId, newParentId, index);
              results.push({
                operation: 'move_node',
                success: true,
                nodeId,
              });
              break;
            }

            default: {
              throw new Error(`Unknown operation type: "${op.type}".`);
            }
          }
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : String(err);
          results.push({
            operation: op.type,
            success: false,
            error: message,
          });
          // Stop processing further operations on failure
          break;
        }
      }

      const allSuccess = results.every((r) => r.success);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: allSuccess,
                results,
                pendingIds: resolvedPendingIds,
              },
              null,
              2,
            ),
          },
        ],
        ...(allSuccess ? {} : { isError: true }),
      };
    },
  );
}
