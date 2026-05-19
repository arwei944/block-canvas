import { describe, it, expect, beforeEach } from 'vitest';
import { CommandManager } from '../commands/command-manager';
import { createBuiltinCommands } from '../commands/builtin-commands';
import { useEditorStore } from '../store/editor-store';
import {
  createDocument,
  createTextBlock,
  createButtonBlock,
  createContainerBlock,
} from '../node';
import { BlockType } from '../types';
import type { Command, CommandParams } from '../commands/types';

describe('CommandManager', () => {
  let manager: CommandManager;
  let executedCommands: string[] = [];
  let undoneCommands: string[] = [];

  beforeEach(() => {
    manager = new CommandManager();
    executedCommands = [];
    undoneCommands = [];

    // Reset store
    useEditorStore.setState({
      document: null,
      selection: { selectedIds: [], hoveredId: null },
      isDragging: false,
      zoom: 1,
      initialized: false,
    });
  });

  describe('register and execute', () => {
    it('should register and execute a command', () => {
      const command: Command = {
        name: 'test.echo',
        description: 'Echo test',
        execute: () => {
          executedCommands.push('echo');
        },
      };

      manager.register(command);
      manager.execute('test.echo', {} as any);

      expect(executedCommands).toEqual(['echo']);
    });

    it('should throw when executing an unregistered command', () => {
      expect(() => manager.execute('nonexistent', {} as any)).toThrow(
        'Command "nonexistent" not found',
      );
    });

    it('should register multiple commands via registerAll', () => {
      const commands: Command[] = [
        {
          name: 'test.a',
          description: 'A',
          execute: () => executedCommands.push('a'),
        },
        {
          name: 'test.b',
          description: 'B',
          execute: () => executedCommands.push('b'),
        },
      ];

      manager.registerAll(commands);
      manager.execute('test.a', {} as any);
      manager.execute('test.b', {} as any);

      expect(executedCommands).toEqual(['a', 'b']);
    });
  });

  describe('undo/redo stack', () => {
    it('should record commands with undo to past stack', () => {
      const command: Command = {
        name: 'test.undoable',
        description: 'Undoable',
        execute: () => executedCommands.push('exec'),
        undo: () => undoneCommands.push('undo'),
      };

      manager.register(command);
      manager.execute('test.undoable', {} as any);

      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
    });

    it('should not record commands without undo', () => {
      const command: Command = {
        name: 'test.nonundoable',
        description: 'Non-undoable',
        execute: () => executedCommands.push('exec'),
      };

      manager.register(command);
      manager.execute('test.nonundoable', {} as any);

      expect(manager.canUndo()).toBe(false);
    });

    it('should undo and move to future stack', () => {
      const command: Command = {
        name: 'test.undoable',
        description: 'Undoable',
        execute: () => executedCommands.push('exec'),
        undo: () => undoneCommands.push('undo'),
      };

      manager.register(command);
      manager.execute('test.undoable', {} as any);
      manager.undo();

      expect(undoneCommands).toEqual(['undo']);
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(true);
    });

    it('should redo and move back to past stack', () => {
      const command: Command = {
        name: 'test.undoable',
        description: 'Undoable',
        execute: () => executedCommands.push('exec'),
        undo: () => undoneCommands.push('undo'),
      };

      manager.register(command);
      manager.execute('test.undoable', {} as any);
      manager.undo();
      manager.redo();

      expect(executedCommands).toEqual(['exec', 'exec']);
      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
    });

    it('should clear future stack when executing a new command', () => {
      const command: Command = {
        name: 'test.undoable',
        description: 'Undoable',
        execute: () => executedCommands.push('exec'),
        undo: () => undoneCommands.push('undo'),
      };

      manager.register(command);
      manager.execute('test.undoable', {} as any);
      manager.undo();
      manager.execute('test.undoable', {} as any);

      expect(manager.canRedo()).toBe(false);
    });

    it('should return correct history state', () => {
      const command: Command = {
        name: 'test.undoable',
        description: 'Test',
        execute: () => {},
        undo: () => {},
      };

      manager.register(command);
      manager.execute('test.undoable', {} as any);

      const history = manager.getHistory();
      expect(history.past).toHaveLength(1);
      expect(history.future).toHaveLength(0);
      expect(history.past[0].commandName).toBe('test.undoable');
    });

    it('should clear history', () => {
      const command: Command = {
        name: 'test.undoable',
        description: 'Test',
        execute: () => {},
        undo: () => {},
      };

      manager.register(command);
      manager.execute('test.undoable', {} as any);
      manager.clear();

      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });
  });

  describe('canUndo / canRedo', () => {
    it('should return false when no history', () => {
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });
  });
});

describe('Builtin commands', () => {
  let manager: CommandManager;
  let doc: ReturnType<typeof createDocument>;

  beforeEach(() => {
    // Reset store
    useEditorStore.setState({
      document: null,
      selection: { selectedIds: [], hoveredId: null },
      isDragging: false,
      zoom: 1,
      initialized: false,
    });

    doc = createDocument('Test');
    useEditorStore.getState().initDocument(doc);

    manager = new CommandManager();
    const builtinCommands = createBuiltinCommands(() => useEditorStore.getState());
    manager.registerAll(builtinCommands);
  });

  describe('node.add', () => {
    it('should add a node via command', () => {
      const newNode = createTextBlock('Added via command');
      manager.execute('node.add', {
        parentId: doc.rootId,
        node: newNode,
      });

      const state = useEditorStore.getState();
      expect(state.document!.nodes[newNode.id]).toBeDefined();
      expect(
        (state.document!.nodes[doc.rootId] as any).props.children,
      ).toContain(newNode.id);
    });

    it('should undo node.add', () => {
      const newNode = createTextBlock('Added via command');
      manager.execute('node.add', {
        parentId: doc.rootId,
        node: newNode,
      });

      manager.undo();

      const state = useEditorStore.getState();
      expect(state.document!.nodes[newNode.id]).toBeUndefined();
    });
  });

  describe('node.remove', () => {
    it('should remove a node via command', () => {
      const textNode = createTextBlock('To remove');
      useEditorStore.getState().addNode(doc.rootId, textNode);

      // Verify node exists
      expect(useEditorStore.getState().document!.nodes[textNode.id]).toBeDefined();

      manager.execute('node.remove', { nodeId: textNode.id });

      const state = useEditorStore.getState();
      expect(state.document!.nodes[textNode.id]).toBeUndefined();
    });

    it('should undo node.remove', () => {
      const textNode = createTextBlock('To remove');
      useEditorStore.getState().addNode(doc.rootId, textNode);

      manager.execute('node.remove', { nodeId: textNode.id });
      manager.undo();

      const state = useEditorStore.getState();
      expect(state.document!.nodes[textNode.id]).toBeDefined();
      expect(
        (state.document!.nodes[doc.rootId] as any).props.children,
      ).toContain(textNode.id);
    });
  });

  describe('node.updateStyle', () => {
    it('should update node style via command', () => {
      const textNode = createTextBlock('Styled', {
        style: { color: 'black' },
      });
      useEditorStore.getState().addNode(doc.rootId, textNode);

      manager.execute('node.updateStyle', {
        nodeId: textNode.id,
        style: { color: 'red', fontSize: '20px' },
      });

      const state = useEditorStore.getState();
      const node = state.document!.nodes[textNode.id];
      expect(node.style.color).toBe('red');
      expect(node.style.fontSize).toBe('20px');
    });

    it('should undo node.updateStyle', () => {
      const textNode = createTextBlock('Styled', {
        style: { color: 'black', fontSize: '14px' },
      });
      useEditorStore.getState().addNode(doc.rootId, textNode);

      manager.execute('node.updateStyle', {
        nodeId: textNode.id,
        style: { color: 'red' },
      });
      manager.undo();

      const state = useEditorStore.getState();
      const node = state.document!.nodes[textNode.id];
      expect(node.style.color).toBe('black');
    });
  });
});
