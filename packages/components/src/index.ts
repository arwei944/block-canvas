// 基础组件
export { TextBlock } from './basic/TextBlock';
export type { TextBlockProps } from './basic/TextBlock';

export { ImageBlock } from './basic/ImageBlock';
export type { ImageBlockProps } from './basic/ImageBlock';

export { ButtonBlock } from './basic/ButtonBlock';
export type { ButtonBlockProps } from './basic/ButtonBlock';

// 布局组件
export { ContainerBlock } from './layout/ContainerBlock';
export type { ContainerBlockProps } from './layout/ContainerBlock';

// 表单组件
export { InputBlock } from './form/InputBlock';
export type { InputBlockProps } from './form/InputBlock';

export { SelectBlock } from './form/SelectBlock';
export type { SelectBlockProps } from './form/SelectBlock';

export { CheckboxBlock } from './form/CheckboxBlock';
export type { CheckboxBlockProps } from './form/CheckboxBlock';

// 数据组件
export { TableBlock } from './data/TableBlock';
export type { TableBlockProps } from './data/TableBlock';

// 组件注册表
export {
  registerComponent,
  getComponent,
  getAllComponents,
} from './registry';
