import {
  BlockType,
  type BlockId,
  type BlockStyle,
  type BlockLayout,
  type BlockNodeBase,
  type TextBlockNode,
  type ImageBlockNode,
  type ButtonBlockNode,
  type ContainerBlockNode,
  type BlockNode,
  type BlockDocument,
} from '../types';

let idCounter = 0;

/**
 * 生成唯一的 BlockId
 */
export function generateBlockId(): BlockId {
  idCounter += 1;
  return `block_${Date.now()}_${idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 创建节点基础对象
 */
export function createBlockBase(
  type: BlockType,
  name: string,
  overrides?: Partial<BlockNodeBase>,
): BlockNodeBase {
  return {
    id: overrides?.id ?? generateBlockId(),
    type,
    name,
    style: { ...overrides?.style },
    layout: { ...overrides?.layout },
    locked: overrides?.locked ?? false,
    visible: overrides?.visible ?? true,
    data: overrides?.data ? { ...overrides.data } : undefined,
  };
}

/**
 * 创建文本节点
 */
export function createTextBlock(
  content: string,
  overrides?: Partial<Omit<TextBlockNode, 'type'>> & { id?: BlockId },
): TextBlockNode {
  const base = createBlockBase(BlockType.Text, overrides?.name ?? 'Text Block', overrides);
  return {
    ...base,
    type: BlockType.Text,
    props: {
      content,
      fontSize: overrides?.props?.fontSize,
      fontWeight: overrides?.props?.fontWeight,
      color: overrides?.props?.color,
      textAlign: overrides?.props?.textAlign,
      lineHeight: overrides?.props?.lineHeight,
      fontFamily: overrides?.props?.fontFamily,
    },
  };
}

/**
 * 创建图片节点
 */
export function createImageBlock(
  src: string,
  overrides?: Partial<Omit<ImageBlockNode, 'type'>> & { id?: BlockId },
): ImageBlockNode {
  const base = createBlockBase(BlockType.Image, overrides?.name ?? 'Image Block', overrides);
  return {
    ...base,
    type: BlockType.Image,
    props: {
      src,
      alt: overrides?.props?.alt,
      objectFit: overrides?.props?.objectFit,
    },
  };
}

/**
 * 创建按钮节点
 */
export function createButtonBlock(
  label: string,
  overrides?: Partial<Omit<ButtonBlockNode, 'type'>> & { id?: BlockId },
): ButtonBlockNode {
  const base = createBlockBase(BlockType.Button, overrides?.name ?? 'Button Block', overrides);
  return {
    ...base,
    type: BlockType.Button,
    props: {
      label,
      href: overrides?.props?.href,
      onClick: overrides?.props?.onClick,
      variant: overrides?.props?.variant,
    },
  };
}

/**
 * 创建容器节点
 */
export function createContainerBlock(
  children?: BlockId[],
  overrides?: Partial<Omit<ContainerBlockNode, 'type'>> & { id?: BlockId },
): ContainerBlockNode {
  const base = createBlockBase(BlockType.Container, overrides?.name ?? 'Container Block', overrides);
  return {
    ...base,
    type: BlockType.Container,
    props: {
      children: children ?? [],
    },
  };
}

/**
 * 创建文档
 */
export function createDocument(name: string): BlockDocument {
  const rootId = generateBlockId();
  const rootNode = createContainerBlock([], { id: rootId, name: 'Root' });

  return {
    id: generateBlockId(),
    name,
    version: 1,
    rootId,
    nodes: {
      [rootId]: rootNode,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 深拷贝节点
 */
export function cloneNode<T extends BlockNode>(node: T): T {
  const cloned: BlockNodeBase = {
    id: generateBlockId(),
    type: node.type,
    name: node.name,
    style: { ...node.style },
    layout: { ...node.layout },
    locked: node.locked,
    visible: node.visible,
    data: node.data ? { ...node.data } : undefined,
  };

  switch (node.type) {
    case BlockType.Text:
      return {
        ...cloned,
        type: BlockType.Text,
        props: { ...node.props },
      } as T;
    case BlockType.Image:
      return {
        ...cloned,
        type: BlockType.Image,
        props: { ...node.props },
      } as T;
    case BlockType.Button:
      return {
        ...cloned,
        type: BlockType.Button,
        props: { ...node.props },
      } as T;
    case BlockType.Container:
      return {
        ...cloned,
        type: BlockType.Container,
        props: {
          children: [...node.props.children],
        },
      } as T;
  }
}

/**
 * 验证节点是否合法
 */
export function validateNode(node: BlockNode): boolean {
  // 基础字段检查
  if (!node.id || typeof node.id !== 'string') return false;
  if (!node.name || typeof node.name !== 'string') return false;
  if (!Object.values(BlockType).includes(node.type)) return false;
  if (node.style == null || typeof node.style !== 'object') return false;
  if (node.layout == null || typeof node.layout !== 'object') return false;

  // 根据 type 检查 props
  switch (node.type) {
    case BlockType.Text:
      if (typeof (node as TextBlockNode).props.content !== 'string') return false;
      break;
    case BlockType.Image:
      if (typeof (node as ImageBlockNode).props.src !== 'string') return false;
      break;
    case BlockType.Button:
      if (typeof (node as ButtonBlockNode).props.label !== 'string') return false;
      break;
    case BlockType.Container:
      if (!Array.isArray((node as ContainerBlockNode).props.children)) return false;
      break;
  }

  return true;
}
