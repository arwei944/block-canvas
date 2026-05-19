import React from 'react';
import { STATUS_DOT_COLORS } from '../shared/constants';
import { Check, RefreshCw, RotateCcw } from 'lucide-react';

export type LogStatus = 'success' | 'pending' | 'error';

export interface LogEntry {
  id: string;
  time: string;
  description: string;
  status: LogStatus;
}

export interface SupervisorPanelProps {
  logs?: LogEntry[];
  onApprove?: () => void;
  onRequestChange?: () => void;
  onRollback?: () => void;
  className?: string;
}

const SupervisorPanel: React.FC<SupervisorPanelProps> = ({
  logs = [],
  onApprove,
  onRequestChange,
  onRollback,
  className = '',
}) => {
  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 ${className}`}
    >
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-zinc-700/80 bg-zinc-800 px-2">
        <span className="text-xs font-semibold text-zinc-300">操作日志</span>
        <span className="text-[11px] font-normal text-zinc-500">
          {logs.length} 条记录
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-auto px-3 py-1">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center py-4 text-zinc-500">
              <span className="text-xs">暂无操作记录</span>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex h-[30px] items-center gap-2 rounded px-2 text-xs transition-colors hover:bg-zinc-800"
              >
                <span className="min-w-[52px] shrink-0 font-mono text-[11px] text-zinc-600">
                  {log.time}
                </span>
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    STATUS_DOT_COLORS[log.status] || 'bg-zinc-500'
                  }`}
                />
                <span className="flex-1 truncate text-zinc-400">
                  {log.description}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex shrink-0 gap-1.5 border-t border-zinc-700/80 bg-zinc-800 px-3 py-1.5">
          <button
            onClick={onApprove}
            className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-green-500"
          >
            <Check size={12} />
            批准
          </button>
          <button
            onClick={onRequestChange}
            className="flex items-center gap-1 rounded-md bg-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-600"
          >
            <RefreshCw size={12} />
            请求修改
          </button>
          <button
            onClick={onRollback}
            className="flex items-center gap-1 rounded-md bg-transparent px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
          >
            <RotateCcw size={12} />
            回滚
          </button>
        </div>
      </div>
    </div>
  );
};

export { SupervisorPanel };
