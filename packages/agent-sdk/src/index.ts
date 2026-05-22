/**
 * @block-canvas/agent-sdk
 *
 * Agent SDK for BlockCanvas editor.
 * Provides structured APIs for node manipulation, transactions,
 * visual feedback, and canvas introspection.
 */

// Client
export { BlockCanvasClient, HttpTransport } from './client';
export type { BlockCanvasClientConfig, HttpTransportConfig, HttpMethod } from './client';

// Nodes API
export { NodesApi } from './api';

// Transaction
export { Transaction, TransactionNodesApi, TransactionFactory } from './transaction';

// Feedback
export { FeedbackApi } from './feedback';

// Describe
export { DescribeApi } from './describe';

// Types
export type {
  ApiResponse,
  AddNodeRequest,
  UpdateDataRequest,
  UpdateStyleRequest,
  UpdateLayoutRequest,
  MoveNodeRequest,
  QueryNodesParams,
  NodeApiResponse,
  NodeGetResponse,
  NodeListResponse,
  SnapshotOptions,
  StructuredSnapshot,
  TreeNode,
  ScreenshotOptions,
  ScreenshotResponse,
  SnapshotResponse,
  DescriptionResponse,
  DiagnosticIssue,
  DiagnosticReport,
  FixResult,
  CanvasOverview,
  ComponentInfo,
  ComponentDefinition,
  NodeRelationships,
  HistoryEntry,
  OperationType,
  Operation,
  TransactionResult,
} from './types';

export { BlockCanvasError } from './types';
