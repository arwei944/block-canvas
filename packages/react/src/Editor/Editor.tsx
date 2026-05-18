import React from 'react';
import { EditorProvider } from '../context/editor-context';
import { Canvas } from '../Canvas';
import type { BlockDocument } from '@block-canvas/core';

// ---- Editor Props ----

export interface EditorProps {
  /** 初始文档 */
  document?: BlockDocument;
  /** 子组件（如工具栏等） */
  children?: React.ReactNode;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

// ---- Editor Component ----

export const Editor: React.FC<EditorProps> = ({
  document,
  children,
  style,
  className,
}) => {
  return (
    <EditorProvider>
      <EditorInner
        document={document}
        style={style}
        className={className}
      >
        {children}
      </EditorInner>
    </EditorProvider>
  );
};

// ---- Inner Component (inside Provider) ----

interface EditorInnerProps {
  document?: BlockDocument;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const EditorInner: React.FC<EditorInnerProps> = ({
  document,
  children,
  style,
  className,
}) => {
  // TODO: 当 document prop 变化时调用 initDocument
  // 目前 Phase 1 暂不实现 prop 联动，由用户手动调用 initDocument

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div style={containerStyle} className={className}>
      <Canvas />
      {children}
    </div>
  );
};
