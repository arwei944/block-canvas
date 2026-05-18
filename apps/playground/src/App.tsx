import React, { useEffect, useCallback } from 'react';
import {
  EditorProvider,
  useEditor,
  Canvas,
  setComponentRegistry,
} from '@block-canvas/react';
import {
  BlockType,
  createDocument,
  createTextBlock,
  createImageBlock,
  createButtonBlock,
  createContainerBlock,
  useEditorStore,
} from '@block-canvas/core';
import {
  getAllComponents,
} from '@block-canvas/components';
import {
  Toolbar,
  LayerPanel,
  PropertyPanel,
  SupervisorPanel,
} from '@block-canvas/ui';
import type { BlockDocument } from '@block-canvas/core';

// ---- 样式 ----

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: '#f5f5f7',
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  layerPanelWrapper: {
    width: 260,
    borderRight: '1px solid #e5e5ea',
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    borderRadius: 0,
    border: 'none',
    boxShadow: 'none',
  },
  canvasWrapper: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f7',
  },
  propertyPanelWrapper: {
    width: 300,
    borderLeft: '1px solid #e5e5ea',
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    borderRadius: 0,
    border: 'none',
    boxShadow: 'none',
  },
  supervisorPanelWrapper: {
    height: 200,
    borderTop: '1px solid #e5e5ea',
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    borderRadius: 0,
    border: 'none',
    boxShadow: 'none',
  },
};

// ---- 初始化示例文档 ----

function createSampleDocument(): BlockDocument {
  const doc = createDocument('演练场示例');

  const textNode1 = createTextBlock('欢迎使用 Block Canvas!', {
    name: '标题',
    style: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      padding: '20px',
      textAlign: 'center',
    },
  });

  const textNode2 = createTextBlock(
    '这是一个用于验证 BlockCanvas 框架核心功能的演练场。请尝试添加节点、撤销/重做以及快照操作。',
    {
      name: '描述',
      style: {
        fontSize: '14px',
        color: '#666',
        padding: '10px 20px',
        textAlign: 'center',
        lineHeight: '1.8',
      },
    },
  );

  const buttonNode1 = createButtonBlock('点击我', {
    name: '操作按钮',
    style: {
      margin: '10px auto',
      width: '120px',
    },
    props: {
      variant: 'primary',
    },
  });

  const imageNode1 = createImageBlock(
    'https://picsum.photos/seed/blockcanvas/400/200',
    {
      name: '示例图片',
      style: {
        width: '400px',
        height: '200px',
        borderRadius: '8px',
        margin: '10px auto',
        objectFit: 'cover',
      },
      props: {
        alt: '示例图片',
        objectFit: 'cover',
      },
    },
  );

  const containerNode = createContainerBlock(
    [textNode1.id, textNode2.id, buttonNode1.id, imageNode1.id],
    {
      name: '主要内容',
      style: {
        width: '500px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: '20px',
        gap: 8,
        alignItems: 'center',
      },
    },
  );

  const rootNode = doc.nodes[doc.rootId];
  if (rootNode && rootNode.type === BlockType.Container) {
    rootNode.props.children = [containerNode.id];
  }

  doc.nodes = {
    ...doc.nodes,
    [textNode1.id]: textNode1,
    [textNode2.id]: textNode2,
    [buttonNode1.id]: buttonNode1,
    [imageNode1.id]: imageNode1,
    [containerNode.id]: containerNode,
  };

  return doc;
}

// ---- EditorApp: 在 EditorProvider 内部，可以访问编辑器上下文 ----

const EditorApp: React.FC = () => {
  const { document, redo } = useEditor();

  // 初始化文档
  useEffect(() => {
    const sampleDoc = createSampleDocument();
    useEditorStore.getState().initDocument(sampleDoc);
  }, []);

  // SupervisorPanel 回调
  const handleApprove = useCallback(() => {
    console.log('[Supervisor] Approved all pending operations');
  }, []);

  const handleRequestChange = useCallback(() => {
    console.log('[Supervisor] Changes requested for pending operations');
  }, []);

  const handleRollback = useCallback(() => {
    if (document) {
      redo();
    }
  }, [document, redo]);

  return (
    <div style={styles.app}>
      {/* 顶部工具栏 */}
      <Toolbar />

      {/* 主区域：左侧图层面板 + 中间画布 + 右侧属性面板 */}
      <div style={styles.mainArea}>
        {/* 左侧图层面板 */}
        <div style={styles.layerPanelWrapper}>
          <LayerPanel style={{ height: '100%', borderRadius: 0, border: 'none', boxShadow: 'none' }} />
        </div>

        {/* 中间画布 */}
        <div style={styles.canvasWrapper}>
          <Canvas />
        </div>

        {/* 右侧属性面板 */}
        <div style={styles.propertyPanelWrapper}>
          <PropertyPanel style={{ height: '100%', borderRadius: 0, border: 'none', boxShadow: 'none' }} />
        </div>
      </div>

      {/* 底部监督面板 */}
      <div style={styles.supervisorPanelWrapper}>
        <SupervisorPanel
          style={{ height: '100%', borderRadius: 0, border: 'none', boxShadow: 'none' }}
          onApprove={handleApprove}
          onRequestChange={handleRequestChange}
          onRollback={handleRollback}
        />
      </div>
    </div>
  );
};

// ---- App 入口 ----

const App: React.FC = () => {
  useEffect(() => {
    // 注册组件：将 @block-canvas/components 的组件注册到 @block-canvas/react 的全局注册表
    const allComponents = getAllComponents();
    setComponentRegistry(allComponents);
  }, []);

  return (
    <EditorProvider>
      <EditorApp />
    </EditorProvider>
  );
};

export default App;