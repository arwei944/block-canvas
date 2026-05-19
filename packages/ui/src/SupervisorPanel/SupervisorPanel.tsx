import React from 'react';
import {
  panelStyles,
  supervisorStyles,
  buttonStyles,
  colors,
  statusDot,
} from '../shared/styles';

interface LogEntry {
  id: string;
  time: string;
  description: string;
  status: 'success' | 'pending' | 'error';
}

interface SupervisorPanelProps {
  style?: React.CSSProperties;
  onApprove?: () => void;
  onRequestChange?: () => void;
  onRollback?: () => void;
}

const SupervisorPanel: React.FC<SupervisorPanelProps> = ({
  style,
  onApprove,
  onRequestChange,
  onRollback,
}) => {
  // 模拟日志数据
  const logs: LogEntry[] = [
    { id: '1', time: '22:15:01', description: '初始化文档 "演练场示例"', status: 'success' },
    { id: '2', time: '22:15:01', description: '添加文本节点 "标题"', status: 'success' },
    { id: '3', time: '22:15:01', description: '添加文本节点 "副标题"', status: 'success' },
    { id: '4', time: '22:15:01', description: '添加图片节点 "封面图"', status: 'success' },
    { id: '5', time: '22:15:01', description: '添加按钮节点 "主按钮"', status: 'success' },
  ];

  return (
    <div style={{ ...panelStyles.container, ...style }}>
      <div style={panelStyles.header}>
        <span>操作日志</span>
        <span style={{ fontSize: 11, fontWeight: 400, color: colors.textTertiary }}>
          {logs.length} 条记录
        </span>
      </div>

      <div style={supervisorStyles.container}>
        <div style={supervisorStyles.logList}>
          {logs.length === 0 ? (
            <div style={{ ...panelStyles.emptyState, padding: '16px' }}>
              <span>暂无操作记录</span>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={supervisorStyles.logItem}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = colors.hover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <span style={supervisorStyles.logTime}>{log.time}</span>
                <span
                  style={{
                    ...supervisorStyles.logStatus,
                    ...statusDot[log.status],
                  }}
                />
                <span style={supervisorStyles.logDescription}>{log.description}</span>
              </div>
            ))
          )}
        </div>

        <div style={supervisorStyles.footer}>
          <button
            style={{ ...buttonStyles.sm, ...buttonStyles.success }}
            onClick={onApprove}
          >
            ✓ 批准
          </button>
          <button
            style={{ ...buttonStyles.sm, ...buttonStyles.secondary }}
            onClick={onRequestChange}
          >
            ↻ 请求修改
          </button>
          <button
            style={{ ...buttonStyles.sm, ...buttonStyles.ghost }}
            onClick={onRollback}
          >
            ⟲ 回滚
          </button>
        </div>
      </div>
    </div>
  );
};

export { SupervisorPanel };
