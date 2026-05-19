// @block-canvas/ui
// Default UI components for BlockCanvas editor

// Panels
export { Toolbar } from './Toolbar';
export type { ToolbarProps } from './Toolbar';

export { LayerPanel } from './LayerPanel';
export type { LayerPanelProps } from './LayerPanel';

export { PropertyPanel } from './PropertyPanel';
export type { PropertyPanelProps } from './PropertyPanel';

export { SupervisorPanel } from './SupervisorPanel';
export type { SupervisorPanelProps, OperationLog, LogStatus } from './SupervisorPanel';

// Fields (re-exported from PropertyPanel for convenience)
export { TextField, NumberField, ColorField, SelectField } from './PropertyPanel/fields';
export type {
  TextFieldProps,
  NumberFieldProps,
  ColorFieldProps,
  SelectFieldProps,
  SelectFieldOption,
} from './PropertyPanel/fields';

// Note: Shared styles have been migrated to Tailwind CSS.
// See apps/playground/src/globals.css and apps/playground/tailwind.config.js
