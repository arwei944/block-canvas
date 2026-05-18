// 节点类型枚举
export enum BlockType {
  Text = 'text',
  Image = 'image',
  Button = 'button',
  Container = 'container',
}

export type BlockId = string;

// 节点样式
export interface BlockStyle {
  width?: string;
  height?: string;
  padding?: string;
  margin?: string;
  backgroundColor?: string;
  borderRadius?: string;
  border?: string;
  opacity?: number;
  zIndex?: number;
  color?: string;
  fontSize?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: string;
  fontFamily?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  display?: string;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  alignItems?: string;
  justifyContent?: string;
  gap?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  position?: 'absolute' | 'relative' | 'static';
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  boxShadow?: string;
  cursor?: string;
  transition?: string;
  transform?: string;
}

// 节点布局
export interface BlockLayout {
  position?: 'absolute' | 'relative' | 'static';
  top?: number;
  left?: number;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  alignItems?: string;
  justifyContent?: string;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  gap?: number;
}

// 各组件 props
export interface TextBlockProps {
  content: string;
  fontSize?: string;
  fontWeight?: string | number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: string;
  fontFamily?: string;
}

export interface ImageBlockProps {
  src: string;
  alt?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

export interface ButtonBlockProps {
  label: string;
  href?: string;
  onClick?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface ContainerBlockProps {
  children: BlockId[];
}

// 节点基础
export interface BlockNodeBase {
  id: BlockId;
  type: BlockType;
  name: string;
  style: BlockStyle;
  layout: BlockLayout;
  locked?: boolean;
  visible?: boolean;
  data?: Record<string, unknown>;
}

// 各类型节点
export interface TextBlockNode extends BlockNodeBase {
  type: BlockType.Text;
  props: TextBlockProps;
}

export interface ImageBlockNode extends BlockNodeBase {
  type: BlockType.Image;
  props: ImageBlockProps;
}

export interface ButtonBlockNode extends BlockNodeBase {
  type: BlockType.Button;
  props: ButtonBlockProps;
}

export interface ContainerBlockNode extends BlockNodeBase {
  type: BlockType.Container;
  props: ContainerBlockProps;
}

export type BlockNode =
  | TextBlockNode
  | ImageBlockNode
  | ButtonBlockNode
  | ContainerBlockNode;

// 文档
export interface BlockDocument {
  id: string;
  name: string;
  version: number;
  rootId: BlockId;
  nodes: Record<BlockId, BlockNode>;
  createdAt: string;
  updatedAt: string;
}
