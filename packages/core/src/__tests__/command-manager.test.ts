import { describe, it, expect, beforeEach } from 'vitest';
import { CommandManager } from '../commands/command-manager';
import type { Command, CommandParams } from '../commands/types';

describe('CommandManager', () => {
  let manager: CommandManager;
  let executeLog: string[];
  let undoLog: string[];

  beforeEach(() => {
    manager = new CommandManager();
    executeLog = [];
    undoLog = [];
  });

  // ---- 注册与执行 ----

  describe('register and execute', () => {
    it('should register and execute a command', () => {
      const command: Command = {
        name: 'test.echo',
        description: 'Echo command',
        execute: (params: CommandParams) => {
          executeLog.push('executed');
        },
      };

      manager.register(command);
      manager.execute('test.echo', {} as any);

      expect(executeLog).toEqual(['executed']);
    });

    it('should throw when executing unregistered command', () => {
      expect(() => manager.execute('nonexistent', {} as any)).toThrow(
        '[CommandManager] Command "nonexistent" not found',
      );
    });

    it('should register multiple commands via registerAll', () => {
      const commands: Command[] = [
        { name: 'cmd.a', description: 'A', execute: () => executeLog.push('a') },
        { name: 'cmd.b', description: 'B', execute: () => executeLog.push('b') },
      ];

      manager.registerAll(commands);
      manager.execute('cmd.a', {} as any);
      manager.execute('cmd.b', {} as any);

      expect(executeLog).toEqual(['a', 'b']);
    });
  });

  // ---- 撤销/重做 ----

  describe('undo', () => {
    it('should undo the last command', () => {
      const command: Command = {
        name: 'test.undoable',
        description: 'Undoable command',
        execute: (params: CommandParams) => {
          executeLog.push('executed');
        },
        undo: (params: CommandParams) => {
          undoLog.push('undone');
        },
      };

      manager.register(command);
      manager.execute('test.undoable', {} as any);

      expect(manager.canUndo()).toBe(true);
      manager.undo();
      expect(undoLog).toEqual(['undone']);
      expect(manager.canUndo()).toBe(false);
    });

    it('should not undo when there is no history', () => {
      expect(manager.canUndo()).toBe(false);
      manager.undo(); // should be a no-op
      expect(manager.canUndo()).toBe(false);
    });

    it('should not record history for commands without undo', () => {
      const command: Command = {
        name: 'test.no-undo',
        description: 'No undo',
        execute: () => executeLog.push('executed'),
      };

      manager.register(command);
      manager.execute('test.no-undo', {} as any);

      expect(manager.canUndo()).toBe(false);
    });
  });

  describe('redo', () => {
    it('should redo an undone command', () => {
      const command: Command = {
        name: 'test.redoable',
        description: 'Redoable command',
        execute: () => executeLog.push('executed'),
        undo: () => undoLog.push('undone'),
      };

      manager.register(command);
      manager.execute('test.redoable', {} as any);
      manager.undo();

      expect(manager.canRedo()).toBe(true);
      manager.redo();
      expect(executeLog).toEqual(['executed', 'executed']);
      expect(manager.canRedo()).toBe(false);
    });

    it('should not redo when there is no future', () => {
      expect(manager.canRedo()).toBe(false);
      manager.redo(); // should be a no-op
    });
  });

  describe('multiple undo/redo cycles', () => {
    it('should support multiple undo operations', () => {
      const commands: Command[] = [
        { name: 'cmd.1', description: '1', execute: () => executeLog.push('1'), undo: () => undoLog.push('undo-1') },
        { name: 'cmd.2', description: '2', execute: () => executeLog.push('2'), undo: () => undoLog.push('undo-2') },
        { name: 'cmd.3', description: '3', execute: () => executeLog.push('3'), undo: () => undoLog.push('undo-3') },
      ];

      manager.registerAll(commands);
      manager.execute('cmd.1', {} as any);
      manager.execute('cmd.2', {} as any);
      manager.execute('cmd.3', {} as any);

      expect(manager.canUndo()).toBe(true);

      manager.undo();
      expect(undoLog).toEqual(['undo-3']);

      manager.undo();
      expect(undoLog).toEqual(['undo-3', 'undo-2']);

      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(true);
    });

    it('should redo after multiple undos', () => {
      const commands: Command[] = [
        { name: 'cmd.1', description: '1', execute: () => executeLog.push('1'), undo: () => undoLog.push('undo-1') },
        { name: 'cmd.2', description: '2', execute: () => executeLog.push('2'), undo: () => undoLog.push('undo-2') },
      ];

      manager.registerAll(commands);
      manager.execute('cmd.1', {} as any);
      manager.execute('cmd.2', {} as any);

      manager.undo();
      manager.undo();

      // Now redo both
      manager.redo();
      expect(executeLog).toEqual(['1', '2', '1']);

      manager.redo();
      expect(executeLog).toEqual(['1', '2', '1', '2']);
    });
  });

  describe('clear redo stack on new command', () => {
    it('should clear redo stack when a new command is executed', () => {
      const commands: Command[] = [
        { name: 'cmd.1', description: '1', execute: () => executeLog.push('1'), undo: () => undoLog.push('undo-1') },
        { name: 'cmd.2', description: '2', execute: () => executeLog.push('2'), undo: () => undoLog.push('undo-2') },
      ];

      manager.registerAll(commands);
      manager.execute('cmd.1', {} as any);
      manager.execute('cmd.2', {} as any);

      // Undo once
      manager.undo();
      expect(manager.canRedo()).toBe(true);

      // Execute a new command - should clear redo stack
      manager.execute('cmd.1', {} as any);
      expect(manager.canRedo()).toBe(false);
    });
  });

  describe('getHistory', () => {
    it('should return current history state', () => {
      const command: Command = {
        name: 'test.cmd',
        description: 'Test',
        execute: () => {},
        undo: () => {},
      };

      manager.register(command);
      manager.execute('test.cmd', { data: 'hello' } as any);

      const history = manager.getHistory();
      expect(history.past).toHaveLength(1);
      expect(history.past[0].commandName).toBe('test.cmd');
      expect(history.past[0].description).toBe('Test');
      expect(history.future).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      const command: Command = {
        name: 'test.cmd',
        description: 'Test',
        execute: () => {},
        undo: () => {},
      };

      manager.register(command);
      manager.execute('test.cmd', {} as any);
      manager.undo();

      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(true);

      manager.clear();

      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });
  });

  // ---- 内置命令集成测试 ----

  describe('built-in commands with store', () => {
    it('should work with node.add command', () => {
      // We test the CommandManager's integration with store-like commands
      let addedNode: any = null;
      const addCommand: Command = {
        name: 'node.add',
        description: 'Add node',
        execute: (params: CommandParams) => {
          addedNode = (params as any).node;
        },
        undo: (params: CommandParams) => {
          addedNode = null;
        },
      };

      manager.register(addCommand);
      const node = { id: 'test-node', type: 'text' };
      manager.execute('node.add', { parentId: 'root', node } as CommandParams);

      expect(addedNode).toEqual(node);
      expect(manager.canUndo()).toBe(true);

      manager.undo();
      expect(addedNode).toBeNull();
    });

    it('should work with node.remove command', () => {
      let removed = false;
      let restored = false;

      const removeCommand: Command = {
        name: 'node.remove',
        description: 'Remove node',
        execute: (params: CommandParams) => {
          removed = true;
        },
        undo: (params: CommandParams) => {
          restored = true;
        },
      };

      manager.register(removeCommand);
      manager.execute('node.remove', { nodeId: 'test-node' } as CommandParams);

      expect(removed).toBe(true);
      manager.undo();
      expect(restored).toBe(true);
    });

    it('should work with node.updateStyle command', () => {
      const styleHistory: any[] = [];

      const styleCommand: Command = {
        name: 'node.updateStyle',
        description: 'Update style',
        execute: (params: CommandParams) => {
          styleHistory.push({ action: 'execute', style: (params as any).style });
        },
        undo: (params: CommandParams) => {
          styleHistory.push({ action: 'undo', style: (params as any).style });
        },
      };

      manager.register(styleCommand);
      manager.execute('node.updateStyle', {
        nodeId: 'test-node',
        style: { color: 'red' },
      } as CommandParams);

      expect(styleHistory).toHaveLength(1);
      expect(styleHistory[0].style.color).toBe('red');

      manager.undo();
      expect(styleHistory).toHaveLength(2);
      expect(styleHistory[1].action).toBe('undo');
    });

    it('should work with node.updateLayout command', () => {
      const layoutHistory: any[] = [];

      const layoutCommand: Command = {
        name: 'node.updateLayout',
        description: 'Update layout',
        execute: (params: CommandParams) => {
          layoutHistory.push({ action: 'execute', layout: (params as any).layout });
        },
        undo: (params: CommandParams) => {
          layoutHistory.push({ action: 'undo', layout: (params as any).layout });
        },
      };

      manager.register(layoutCommand);
      manager.execute('node.updateLayout', {
        nodeId: 'test-node',
        layout: { flexDirection: 'column', gap: 16 },
      } as CommandParams);

      expect(layoutHistory).toHaveLength(1);
      expect(layoutHistory[0].layout.flexDirection).toBe('column');

      manager.undo();
      expect(layoutHistory).toHaveLength(2);
    });

    it('should work with node.move command', () => {
      const moveHistory: any[] = [];

      const moveCommand: Command = {
        name: 'node.move',
        description: 'Move node',
        execute: (params: CommandParams) => {
          moveHistory.push({ action: 'execute', params: params as any });
        },
        undo: (params: CommandParams) => {
          moveHistory.push({ action: 'undo', params: params as any });
        },
      };

      manager.register(moveCommand);
      manager.execute('node.move', {
        nodeId: 'test-node',
        newParentId: 'new-parent',
        index: 2,
      } as CommandParams);

      expect(moveHistory).toHaveLength(1);
      expect(moveHistory[0].params.newParentId).toBe('new-parent');
      expect(moveHistory[0].params.index).toBe(2);

      manager.undo();
      expect(moveHistory).toHaveLength(2);
    });
  });
});
