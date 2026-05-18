import React from 'react';
import type { BlockNode } from '@block-canvas/core';
import { BlockType } from '@block-canvas/core';
import { TextBlock } from './basic/TextBlock';
import { ImageBlock } from './basic/ImageBlock';
import { ButtonBlock } from './basic/ButtonBlock';
import { ContainerBlock } from './layout/ContainerBlock';
import { InputBlock } from './form/InputBlock';
import { SelectBlock } from './form/SelectBlock';
import { CheckboxBlock } from './form/CheckboxBlock';
import { TableBlock } from './data/TableBlock';

// ---- 组件注册表 ----

type BlockComponentType = React.ComponentType<{ node: BlockNode }>;

const registry: Record<string, BlockComponentType> = {};

/**
 * 注册组件到注册表
 */
export function registerComponent(
  type: string,
  component: BlockComponentType,
): void {
  registry[type] = component;
}

/**
 * 从注册表获取组件
 */
export function getComponent(type: string): BlockComponentType | undefined {
  return registry[type];
}

/**
 * 获取所有已注册的组件
 */
export function getAllComponents(): Record<string, BlockComponentType> {
  return { ...registry };
}

// ---- 注册默认组件 ----

registerComponent(BlockType.Text, TextBlock as BlockComponentType);
registerComponent(BlockType.Image, ImageBlock as BlockComponentType);
registerComponent(BlockType.Button, ButtonBlock as BlockComponentType);
registerComponent(BlockType.Container, ContainerBlock as BlockComponentType);

// ---- 注册表单组件 ----

registerComponent('input', InputBlock as BlockComponentType);
registerComponent('select', SelectBlock as BlockComponentType);
registerComponent('checkbox', CheckboxBlock as BlockComponentType);

// ---- 注册数据组件 ----

registerComponent('table', TableBlock as BlockComponentType);
