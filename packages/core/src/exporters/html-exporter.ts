import type { BlockDocument, BlockNode, BlockStyle } from '../types/node';
import { BlockType } from '../types/node';
import type { ExporterDefinition } from '../plugin/types';

// ---- 样式工具函数 ----

/**
 * 将 BlockStyle 转换为 CSS 字符串
 */
function styleToCSS(style: BlockStyle, id: string): string {
  const lines: string[] = [];
  lines.push(`#${id} {`);

  if (style.width) lines.push(`  width: ${style.width};`);
  if (style.height) lines.push(`  height: ${style.height};`);
  if (style.padding) lines.push(`  padding: ${style.padding};`);
  if (style.margin) lines.push(`  margin: ${style.margin};`);
  if (style.backgroundColor) lines.push(`  background-color: ${style.backgroundColor};`);
  if (style.borderRadius) lines.push(`  border-radius: ${style.borderRadius};`);
  if (style.border) lines.push(`  border: ${style.border};`);
  if (style.opacity !== undefined) lines.push(`  opacity: ${style.opacity};`);
  if (style.zIndex !== undefined) lines.push(`  z-index: ${style.zIndex};`);
  if (style.color) lines.push(`  color: ${style.color};`);
  if (style.fontSize) lines.push(`  font-size: ${style.fontSize};`);
  if (style.fontWeight) lines.push(`  font-weight: ${style.fontWeight};`);
  if (style.textAlign) lines.push(`  text-align: ${style.textAlign};`);
  if (style.lineHeight) lines.push(`  line-height: ${style.lineHeight};`);
  if (style.fontFamily) lines.push(`  font-family: ${style.fontFamily};`);
  if (style.display) lines.push(`  display: ${style.display};`);
  if (style.flexDirection) lines.push(`  flex-direction: ${style.flexDirection};`);
  if (style.alignItems) lines.push(`  align-items: ${style.alignItems};`);
  if (style.justifyContent) lines.push(`  justify-content: ${style.justifyContent};`);
  if (style.gap !== undefined) lines.push(`  gap: ${style.gap}px;`);
  if (style.flexGrow !== undefined) lines.push(`  flex-grow: ${style.flexGrow};`);
  if (style.flexShrink !== undefined) lines.push(`  flex-shrink: ${style.flexShrink};`);
  if (style.flexBasis) lines.push(`  flex-basis: ${style.flexBasis};`);
  if (style.overflow) lines.push(`  overflow: ${style.overflow};`);
  if (style.position) lines.push(`  position: ${style.position};`);
  if (style.top !== undefined) lines.push(`  top: ${style.top}px;`);
  if (style.left !== undefined) lines.push(`  left: ${style.left}px;`);
  if (style.right !== undefined) lines.push(`  right: ${style.right}px;`);
  if (style.bottom !== undefined) lines.push(`  bottom: ${style.bottom}px;`);
  if (style.boxShadow) lines.push(`  box-shadow: ${style.boxShadow};`);
  if (style.cursor) lines.push(`  cursor: ${style.cursor};`);
  if (style.transition) lines.push(`  transition: ${style.transition};`);
  if (style.transform) lines.push(`  transform: ${style.transform};`);

  lines.push('}');
  return lines.join('\n');
}

/**
 * 将 layout 属性合并到 style 中生成 CSS
 */
function layoutToCSS(node: BlockNode, id: string): string {
  const { layout, style } = node;
  const merged: BlockStyle = {
    ...layout,
    ...style,
  };
  // layout 的 gap 是 number，style 的 gap 也是 number，统一处理
  if (layout.gap !== undefined && style.gap === undefined) {
    merged.gap = layout.gap;
  }
  return styleToCSS(merged, id);
}

// ---- HTML 生成 ----

/**
 * 递归生成节点 HTML
 */
function nodeToHTML(
  nodeId: string,
  nodes: Record<string, BlockNode>,
  cssCollector: string[],
  indent: number,
): string {
  const node = nodes[nodeId];
  if (!node) return '';

  const pad = '  '.repeat(indent);
  const id = `block-${node.id}`;
  const css = layoutToCSS(node, id);
  cssCollector.push(css);

  const classAttr = `class="${node.type}" id="${id}"`;

  switch (node.type) {
    case BlockType.Text: {
      const props = node.props as { content: string };
      return `${pad}<div ${classAttr}>${escapeHTML(props.content)}</div>`;
    }
    case BlockType.Image: {
      const props = node.props as { src: string; alt?: string };
      return `${pad}<img ${classAttr} src="${escapeAttr(props.src)}" alt="${escapeAttr(props.alt ?? '')}" />`;
    }
    case BlockType.Button: {
      const props = node.props as { label: string; href?: string };
      if (props.href) {
        return `${pad}<a ${classAttr} href="${escapeAttr(props.href)}">${escapeHTML(props.label)}</a>`;
      }
      return `${pad}<button ${classAttr}>${escapeHTML(props.label)}</button>`;
    }
    case BlockType.Container: {
      const props = node.props as { children: string[] };
      const childrenHTML = props.children
        .map((childId) => nodeToHTML(childId, nodes, cssCollector, indent + 1))
        .join('\n');
      return `${pad}<div ${classAttr}>\n${childrenHTML}\n${pad}</div>`;
    }
    default: {
      // 未知类型作为 div 处理
      return `${pad}<div ${classAttr}></div>`;
    }
  }
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * HTML/CSS 导出器 —— 将 BlockDocument 导出为完整的 HTML 文档。
 */
export const htmlExporter: ExporterDefinition = {
  format: 'html',
  name: 'HTML',

  async export(document: BlockDocument): Promise<string> {
    const cssCollector: string[] = [];
    const bodyHTML = nodeToHTML(document.rootId, document.nodes, cssCollector, 2);

    const css = cssCollector.join('\n\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHTML(document.name)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    img {
      display: block;
      max-width: 100%;
    }

${css}
  </style>
</head>
<body>
${bodyHTML}
</body>
</html>`;
  },
};
