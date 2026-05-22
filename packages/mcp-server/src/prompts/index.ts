import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * 注册 MCP 提示词模板
 *
 * 提供面向不同场景的 AI 引导提示词，帮助 AI 按照正确的步骤和规范完成画布操作。
 */
export function registerPrompts(server: McpServer) {
  // ---- 1. build_page_from_scratch ----

  server.prompt(
    'build_page_from_scratch',
    'Guide the AI to build a complete page from scratch on the BlockCanvas editor, step by step.',
    {
      description: z
        .string()
        .optional()
        .describe(
          'A brief description of the page to build (e.g., "a landing page for a SaaS product").',
        ),
      style: z
        .enum(['modern', 'minimal', 'corporate'])
        .optional()
        .default('modern')
        .describe(
          'Visual style to apply: "modern" (bold colors, gradients, shadows), "minimal" (clean, lots of whitespace), "corporate" (professional, muted tones).',
        ),
    },
    async ({ description, style }) => {
      const styleGuidelines: Record<string, string> = {
        modern: `Visual Style: Modern
- Use bold accent colors (e.g., #6366f1, #8b5cf6, #06b6d4) with gradients
- Apply subtle box shadows (0 4px 6px -1px rgba(0,0,0,0.1))
- Use rounded corners (borderRadius: 8px to 16px)
- Large headings (fontSize: 32px to 48px) with tight line heights
- Generous spacing between sections (gap: 24px to 48px)
- Consider using backdrop-blur for overlays`,

        minimal: `Visual Style: Minimal
- Use a neutral color palette (whites, light grays, one accent color)
- Minimal or no box shadows
- Clean borders or no borders at all
- Comfortable whitespace (padding: 32px to 64px)
- Simple typography (fontSize: 16px to 24px, lineHeight: 1.6)
- Focus on content hierarchy and readability`,

        corporate: `Visual Style: Corporate
- Use professional colors (navy, dark blue, charcoal, white)
- Subtle shadows and thin borders
- Moderate border radius (4px to 8px)
- Structured grid layouts
- Professional typography (system fonts or serif for headings)
- Consistent spacing aligned to an 8px grid`,
      };

      const pageDescription = description
        ? `The user wants to build: ${description}`
        : 'The user wants to build a page but has not specified details. Ask for clarification about the page purpose, content sections, and any specific requirements.';

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `${pageDescription}

You are building a page on BlockCanvas. Follow these steps carefully:

## Step-by-Step Process

### Step 1: Understand the Current State
- Call \`get_canvas_snapshot\` with detail="summary" to see what already exists on the canvas.
- If the canvas already has content, ask the user if they want to clear it or build on top of it.

### Step 2: Plan the Structure
- Based on the page description, plan the component hierarchy.
- Identify the main sections (header, hero, features, footer, etc.).
- Decide on the layout strategy (use \`apply_layout_preset\` for common patterns).

### Step 3: Build the Page
- Use \`execute_transaction\` to create multiple nodes at once for efficiency.
- Start with the root layout container, then add sections, then add content within each section.
- Use \`pendingKey\` in add_node operations and \`<pending:key>\` references to link parent-child relationships within a single transaction.

### Step 4: Apply Layout
- Use \`set_layout\` to set flex/grid modes on containers.
- Use \`apply_layout_preset\` for common layouts (e.g., "header-content-footer", "two-columns", "center-stack").
- Use \`align_nodes\` and \`distribute_nodes\` for fine-tuning alignment.

### Step 5: Apply Styles
- Use \`update_style\` operations within \`execute_transaction\` to set colors, fonts, spacing, etc.
- Follow these style guidelines:

${styleGuidelines[style]}

### Step 6: Verify
- Call \`describe_canvas\` with style="detailed" to review the result.
- Call \`diagnose_layout\` to check for any layout issues.
- Fix any issues found before presenting the final result to the user.

## Important Rules
- Always use \`execute_transaction\` for batch operations instead of individual tool calls.
- Use \`pendingKey\` and \`<pending:key>\` references to chain node creation within a transaction.
- Never hardcode node IDs from previous calls; always use the IDs returned by the tools.
- After making changes, verify the result with \`describe_canvas\` or \`get_canvas_snapshot\`.
- If you encounter errors, explain them clearly and suggest alternatives.`,
            },
          },
        ],
      };
    },
  );

  // ---- 2. fix_layout_issues ----

  server.prompt(
    'fix_layout_issues',
    'Guide the AI to diagnose layout problems on the canvas and systematically fix them.',
    {
      focus: z
        .string()
        .optional()
        .describe(
          'Optional focus area (e.g., "overlaps", "alignment", "overflow") to prioritize specific types of issues.',
        ),
    },
    async ({ focus }) => {
      const focusSection = focus
        ? `The user wants to focus on: ${focus}. Prioritize issues related to this area, but also check for other problems.`
        : 'Check for all types of layout issues systematically.';

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `You are tasked with diagnosing and fixing layout issues on a BlockCanvas page.

${focusSection}

## Step-by-Step Process

### Step 1: Diagnose
- Call \`diagnose_layout\` to get a full diagnostic report of the canvas.
- The report includes issues with severity levels (error, warning, info), affected node IDs, descriptions, and suggested fixes.
- Review each issue carefully and prioritize by severity (errors first, then warnings, then info).

### Step 2: Understand the Context
- Call \`get_canvas_snapshot\` with detail="full", includeStyles=true, includeLayout=true to understand the full context of the affected nodes.
- For specific nodes mentioned in the diagnostic report, call \`get_node_relationships\` to understand their parent-child structure.

### Step 3: Plan Fixes
- For each issue, determine the best fix strategy:
  - **Overlaps**: Adjust positions using \`set_layout\` or \`align_nodes\`, or switch from free positioning to flex/grid layout.
  - **Overflows**: Increase container height, reduce child sizes, or set overflow: auto.
  - **Misalignments**: Use \`align_nodes\` to align elements consistently.
  - **Inconsistencies**: Use \`execute_transaction\` with \`update_style\` operations to unify styles.
  - **Empty containers**: Add child nodes or remove the empty container.
  - **Deep nesting**: Flatten the structure by removing unnecessary intermediate containers.
  - **Tiny elements**: Increase dimensions using \`set_node_size\`.

### Step 4: Apply Fixes
- Group related fixes together and apply them using \`execute_transaction\` for efficiency.
- For layout fixes, use \`set_layout\`, \`apply_layout_preset\`, \`align_nodes\`, \`distribute_nodes\`, and \`center_node\` as appropriate.
- For style fixes, use \`update_style\` operations within transactions.

### Step 5: Verify
- After applying fixes, call \`diagnose_layout\` again to confirm the issues are resolved.
- Call \`describe_canvas\` to verify the overall layout still looks correct.
- If new issues were introduced, repeat the process.

## Important Rules
- Always diagnose before fixing. Do not make assumptions about what is wrong.
- Fix issues in order of severity (errors > warnings > info).
- After fixing, always re-run diagnostics to verify.
- Explain each fix to the user, including what the issue was and how it was resolved.
- If an issue cannot be automatically fixed, explain why and suggest manual intervention.`,
            },
          },
        ],
      };
    },
  );

  // ---- 3. apply_design_system ----

  server.prompt(
    'apply_design_system',
    'Guide the AI to apply a consistent design system (theme, colors, typography, spacing) across the entire canvas.',
    {
      theme: z
        .enum(['dark', 'light'])
        .optional()
        .default('light')
        .describe('Color theme: "dark" for dark backgrounds with light text, "light" for light backgrounds with dark text.'),
      primaryColor: z
        .string()
        .optional()
        .describe(
          'Primary color in hex format (e.g., "#6366f1"). If not provided, a default will be chosen based on the theme.',
        ),
    },
    async ({ theme, primaryColor }) => {
      const defaultColors: Record<string, string> = {
        dark: '#818cf8',
        light: '#4f46e5',
      };
      const color = primaryColor ?? defaultColors[theme];

      const themeGuidelines =
        theme === 'dark'
          ? `Theme: Dark Mode
- Background colors: #0f172a (main), #1e293b (cards/sections), #334155 (elevated)
- Text colors: #f8fafc (primary), #94a3b8 (secondary), #64748b (muted)
- Border colors: #334155 (subtle), #475569 (medium)
- Use subtle shadows: 0 4px 6px -1px rgba(0,0,0,0.3)
- Ensure sufficient contrast ratios for accessibility`
          : `Theme: Light Mode
- Background colors: #ffffff (main), #f8fafc (cards/sections), #f1f5f9 (elevated)
- Text colors: #0f172a (primary), #475569 (secondary), #94a3b8 (muted)
- Border colors: #e2e8f0 (subtle), #cbd5e1 (medium)
- Use subtle shadows: 0 4px 6px -1px rgba(0,0,0,0.07)
- Ensure sufficient contrast ratios for accessibility`;

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `You are tasked with applying a consistent design system across the entire BlockCanvas page.

## Design System Configuration
- **Theme**: ${theme === 'dark' ? 'Dark' : 'Light'}
- **Primary Color**: ${color}

${themeGuidelines}

## Design Tokens to Apply

### Colors
- Primary: ${color}
- Primary hover: slightly darker/lighter variant of ${color}
- Background: ${theme === 'dark' ? '#0f172a' : '#ffffff'}
- Surface/Card: ${theme === 'dark' ? '#1e293b' : '#f8fafc'}
- Text primary: ${theme === 'dark' ? '#f8fafc' : '#0f172a'}
- Text secondary: ${theme === 'dark' ? '#94a3b8' : '#475569'}
- Border: ${theme === 'dark' ? '#334155' : '#e2e8f0'}

### Typography
- Headings: fontSize 24px-36px, fontWeight 700, lineHeight 1.2
- Body: fontSize 16px, fontWeight 400, lineHeight 1.6
- Small/Caption: fontSize 14px, fontWeight 400, lineHeight 1.5
- Use a consistent fontFamily across all text nodes

### Spacing
- Section padding: 32px-64px
- Card padding: 16px-24px
- Gap between sibling elements: 16px-24px
- Margin between sections: 32px-48px

### Borders & Shadows
- Border radius: 8px for cards, 6px for buttons, 4px for inputs
- Box shadow for cards: ${theme === 'dark' ? '0 4px 6px -1px rgba(0,0,0,0.3)' : '0 4px 6px -1px rgba(0,0,0,0.07)'}
- Border: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'} for cards and sections

### Buttons
- Primary button: backgroundColor ${color}, color #ffffff, borderRadius 6px, padding 10px 20px
- Secondary button: backgroundColor transparent, border 1px solid ${color}, color ${color}, borderRadius 6px, padding 10px 20px

## Step-by-Step Process

### Step 1: Audit Current State
- Call \`get_canvas_snapshot\` with detail="full" and includeStyles=true to see all current styles.
- Call \`get_component_defs\` to understand available component types and their default styles.
- Identify all nodes that need style updates.

### Step 2: Plan the Updates
- Group nodes by type (text, button, container, image).
- For each group, determine the target styles based on the design tokens above.
- Identify which nodes need background color changes (containers) vs. text color changes (text/button nodes).

### Step 3: Apply Styles in Batches
- Use \`execute_transaction\` with multiple \`update_style\` operations to apply styles efficiently.
- Process updates in this order:
  1. Container backgrounds and borders
  2. Text colors and typography
  3. Button styles
  4. Layout adjustments (padding, gap)
  5. Border radius and shadows

### Step 4: Verify Consistency
- Call \`get_canvas_snapshot\` with detail="full" and includeStyles=true to verify all styles are applied.
- Call \`diagnose_layout\` to check if style changes introduced any layout issues.
- Call \`describe_canvas\` with style="detailed" to get a human-readable overview.

### Step 5: Fix Any Issues
- If the diagnostic reveals new issues (e.g., text overflow after font size changes), fix them.
- Re-verify until no issues remain.

## Important Rules
- Apply styles consistently across all nodes of the same type.
- Do not override functional styles (e.g., position, display, flexDirection) unless necessary.
- Preserve the existing layout structure; only modify visual styles.
- Always verify the result after applying changes.
- Explain what was changed and why to the user.`,
            },
          },
        ],
      };
    },
  );
}
