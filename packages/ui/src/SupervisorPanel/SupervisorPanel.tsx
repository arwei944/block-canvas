import React, { useState, useCallback } from 'react';
import { panelStyles, supervisorStyles, buttonStyles, colors } from '../shared/styles';

export type LogStatus = 'success' | 'pending' | 'error';

export interface OperationLog {
  id: string;
  timestamp: number;
  description: string;
  status: LogStatus;
}

const STATUS_ICONS: Record<LogStatus, string> = {
  success: '\u2705',
  pending: '\u23F3',
  error: '\u274C',
};

export interface SupervisorPanelProps {
  logs?: OperationLog[];
  onApprove?: () => void;
  onRequestChange?: () => void;
  onRollback?: () => void;
  style?: React.CSSProperties;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const SupervisorPanel: React.FC<SupervisorPanelProps> = ({
  logs: externalLogs,
  onApprove,
  onRequestChange,
  onRollback,
  style,
}) => {
  const [internalLogs] = useState<OperationLog[]>([
    {
      id: '1',
      timestamp: Date.now() - 60000,
      description: 'AI 生成了一个新文本块',
      status: 'success',
    },
    {
      id: '2',
      timestamp: Date.now() - 30000,
      description: 'AI 调整了布局间距',
      status: 'success',
    },
    {
      id: '3',
      timestamp: Date.now() - 10000,
      description: 'AI 添加了一个按钮组件',
      status: 'pending',
    },
  ]);

  const logs = externalLogs ?? internalLogs;
  const recentLogs = logs.slice(-20).reverse();

  const [hoveredLogId, setHoveredLogId] = useState<string | null>(null);

  const handleApprove = useCallback(() => {
    onApprove?.();
  }, [onApprove]);

  const handleRequestChange = useCallback(() => {
    onRequestChange?.();
  }, [onRequestChange]);

  const handleRollback = useCallback(() => {
    onRollback?.();
  }, [onRollback]);

  return (
    <div style={{ ...panelStyles.container, ...style }}>
      <div style={panelStyles.header}>
        <span>监督面板</span>
        <span style={{ fontSize: 11, color: colors.textTertiary, fontWeight: 400 }}>
          {recentLogs.filter((l) => l.status === 'pending').length} 待处理
        </span>
      </div>
      <div style={supervisorStyles.container}>
        {/* 日志列表 */}
        <div style={supervisorStyles.logList}>
          {recentLogs.length === 0 ? (
            <div style={panelStyles.emptyState}>暂无操作记录</div>
          ) : (
            recentLogs.map((log) => (
              <div
                key={log.id}
                style={
                  hoveredLogId === log.id
                    ? supervisorStyles.logItemHover
                    : supervisorStyles.logItem
                }
                onMouseEnter={() => setHoveredLogId(log.id)}
                onMouseLeave={() => setHoveredLogId(null)}
              >
                <span style={supervisorStyles.logTime}>
                  {formatTime(log.timestamp)}
                </span>
                <span style={supervisorStyles.logDescription}>
                  {log.description}
                </span>
                <span style={supervisorStyles.logStatus}>
                  {STATUS_ICONS[log.status]}
                </span>
              </div>
            ))
          )}
        </div>

        {/* 底部操作按钮 */}
        <div style={supervisorStyles.footer}>
          <button
            style={buttonStyles.success}
            onClick={handleApprove}
            title="批准所有待处理操作"
          >
            {'\u2705'} 批准
          </button>
          <button
            style={buttonStyles.secondary}
            onClick={handleRequestChange}
            title="对待处理操作请求修改"
          >
            {'\u270F'} 请求修改
          </button>
          <button
            style={buttonStyles.danger}
            onClick={handleRollback}
            title="回滚上次操作"
          >
            {'\u21A9'} 回滚
          </button>
        </div>
      </div>
    </div>
  );
};
