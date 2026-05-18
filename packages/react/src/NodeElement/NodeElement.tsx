import React, { useCallback, useMemo } from 'react';
import { useEditorContext } from '../context/editor-context';
import { useNode } from '../hooks/use-node';
import { BlockType } from '@block-canvas/core';
import type { BlockNode, ContainerBlockNode, BlockStyle } from '@block-canvas/core';

// 组件注册表类型
type ComponentType = React.ComponentType<{ node: BlockNode }>;

/**
 * 获取全局组件注册表
 */
let componentRegistry: Record<string, ComponentType> = {};

/**
 * 注册组件
 */
export function registerComponent(
  type: string,
  component: ComponentType,
): void {
  componentRegistry[type] = component;
}

/**
 * 获取组件
 */
export function getComponent(type: string): ComponentType | undefined {
  return componentRegistry[type];
}

/**
 * 设置组件注册表（用于注入）
 */
export function setComponentRegistry(
  registry: Record<string, ComponentType>,
): void {
  componentRegistry = registry;
}

// ---- NodeElement Props ----

export interface NodeElementProps {
  nodeId: string;
}

// ---- NodeElement Component ----

export const NodeElement: React.FC<NodeElementProps> = ({ nodeId }) => {
  const { store } = useEditorContext();
  const { node, isSelected, isHovered } = useNode(nodeId);

  // 使用 getState() 获取 actions，避免每次渲染返回新引用导致无限循环
  const selectNode = useCallback(
    (id: string, multi?: boolean) => store.getState().selectNode(id, multi),
    [store],
  );
  const setHoveredNode = useCallback(
    (id: string | null) => store.getState().setHoveredNode(id),
    [store],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node && !node.locked) {
        selectNode(nodeId, e.shiftKey || e.metaKey || e.ctrlKey);
      }
    },
    [node, nodeId, selectNode],
  );

  const handleMouseEnter = useCallback(() => {
    setHoveredNode(nodeId);
  }, [nodeId, setHoveredNode]);

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, [setHoveredNode]);

  if (!node) {
    return null;
  }

  // 不可见节点不渲染
  if (node.visible === false) {
    return null;
  }

  // 查找注册的组件
  const RegisteredComponent = getComponent(node.type);

  // 合并节点样式和选中/悬停状态
  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    const base: React.CSSProperties = {
      position: 'relative',
      boxSizing: 'border-box',
      ...filterStyle(node.style),
    };

    // 选中状态：蓝色边框
    if (isSelected) {
      base.outline = '2px solid #1677ff';
      base.outlineOffset = '-1px';
    }

    // 悬停状态
    if (isHovered && !isSelected) {
      base.outline = '1px dashed #1677ff';
      base.outlineOffset = '-1px';
    }

    return base;
  }, [node.style, isSelected, isHovered]);

  return (
    <div
      style={wrapperStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-node-id={nodeId}
      data-node-type={node.type}
    >
      {RegisteredComponent ? (
        <RegisteredComponent node={node} />
      ) : (
        <DefaultNodeFallback node={node} />
      )}
    </div>
  );
};

// ---- 默认回退组件 ----

const DefaultNodeFallback: React.FC<{ node: BlockNode }> = ({ node }) => {
  return (
    <div
      style={{
        padding: '8px 12px',
        backgroundColor: '#fff3cd',
        border: '1px dashed #ffc107',
        borderRadius: 4,
        color: '#856404',
        fontSize: 12,
      }}
    >
      未知组件: {node.type} ({node.name})
    </div>
  );
};

// ---- 工具函数 ----

/**
 * 过滤 BlockStyle，只保留有效的 CSS 属性
 */
function filterStyle(
  style: BlockStyle,
): React.CSSProperties {
  const result: Record<string, unknown> = {};
  const cssKeys = new Set([
    'width',
    'height',
    'padding',
    'margin',
    'backgroundColor',
    'borderRadius',
    'border',
    'opacity',
    'zIndex',
    'color',
    'fontSize',
    'fontWeight',
    'textAlign',
    'lineHeight',
    'fontFamily',
    'objectFit',
    'display',
    'flexDirection',
    'alignItems',
    'justifyContent',
    'gap',
    'flexGrow',
    'flexShrink',
    'flexBasis',
    'overflow',
    'position',
    'top',
    'left',
    'right',
    'bottom',
    'boxShadow',
    'cursor',
    'transition',
    'transform',
  ]);

  for (const [key, value] of Object.entries(style)) {
    if (cssKeys.has(key) && value !== undefined && value !== null) {
      result[key] = value;
    }
  }

  return result as React.CSSProperties;
}
