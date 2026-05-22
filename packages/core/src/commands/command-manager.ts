import type {
  Command,
  CommandParams,
  CommandRegistry,
  HistoryEntry,
  HistoryState,
} from './types';

export class CommandManager {
  private registry: CommandRegistry = new Map();
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];

  /**
   * 注册一个命令
   */
  register(command: Command): void {
    this.registry.set(command.name, command);
  }

  /**
   * 批量注册命令
   */
  registerAll(commands: Command[]): void {
    for (const cmd of commands) {
      this.register(cmd);
    }
  }

  /**
   * 执行命令，如果有 undo 则记录到 past，清空 future
   */
  execute(name: string, params: CommandParams): void {
    const command = this.registry.get(name);
    if (!command) {
      throw new Error(`[CommandManager] Command "${name}" not found`);
    }

    command.execute(params);

    // 只有支持 undo 的命令才记录历史
    if (command.undo) {
      const entry: HistoryEntry = {
        commandName: name,
        description: command.description,
        params,
        timestamp: Date.now(),
      };
      this.past.push(entry);
      // 执行新命令后清空 future（分支被丢弃）
      this.future = [];
    }
  }

  /**
   * 撤销：从 past 弹出，调用 undo，压入 future
   */
  undo(): void {
    if (!this.canUndo()) return;

    const entry = this.past.pop()!;
    const command = this.registry.get(entry.commandName);
    if (!command || !command.undo) return;

    command.undo(entry.params);
    this.future.push(entry);
  }

  /**
   * 重做：从 future 弹出，调用 execute，压入 past
   */
  redo(): void {
    if (!this.canRedo()) return;

    const entry = this.future.pop()!;
    const command = this.registry.get(entry.commandName);
    if (!command) return;

    command.execute(entry.params);
    this.past.push(entry);
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.past.length > 0;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * 获取当前历史状态
   */
  getHistory(): HistoryState {
    return {
      past: [...this.past],
      future: [...this.future],
    };
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.past = [];
    this.future = [];
  }
}
