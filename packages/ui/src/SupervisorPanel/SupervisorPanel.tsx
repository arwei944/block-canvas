import React, { useMemo } from 'react';
import { useTheme } from '@block-canvas/theme';
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
  const theme = useTheme();

  const styles = useMemo(() => ({
    container: {
      display: 'flex',
      height: '100%',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surface,
    },
    header: {
      display: 'flex',
      height: 32,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'space-between' as const,
      borderBottom: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surfaceHover,
      padding: '0 8px',
    },
    headerTitle: {
      fontSize: 12,
      fontWeight: 600,
      color: theme.colors.textPrimary,
    },
    headerCount: {
      fontSize: 11,
      fontWeight: 400,
      color: theme.colors.textTertiary,
    },
    content: {
      display: 'flex',
      flex: 1,
      flexDirection: 'column' as const,
    },
    logList: {
      flex: 1,
      overflow: 'auto',
      padding: '4px 12px',
    },
    logItem: {
      display: 'flex',
      height: 30,
      alignItems: 'center',
      gap: 8,
      borderRadius: theme.radius.sm,
      padding: '0 8px',
      fontSize: 12,
      transition: `all ${theme.transitions.fast}`,
    },
    logTime: {
      minWidth: 52,
      flexShrink: 0,
      fontFamily: 'monospace',
      fontSize: 11,
      color: theme.colors.textTertiary,
    },
    statusDot: {
      height: 6,
      width: 6,
      flexShrink: 0,
      borderRadius: '50%',
    },
    logDescription: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: theme.colors.textSecondary,
    },
    emptyState: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      color: theme.colors.textTertiary,
    },
    footer: {
      display: 'flex',
      flexShrink: 0,
      gap: 6,
      borderTop: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surfaceHover,
      padding: '6px 12px',
    },
    approveButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.success,
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 500,
      color: '#fff',
      transition: `all ${theme.transitions.fast}`,
      cursor: 'pointer',
      border: 'none',
    },
    changeButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.surfaceSelected,
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 500,
      color: theme.colors.textPrimary,
      transition: `all ${theme.transitions.fast}`,
      cursor: 'pointer',
      border: 'none',
    },
    rollbackButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      borderRadius: theme.radius.sm,
      backgroundColor: 'transparent',
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 500,
      color: theme.colors.textSecondary,
      transition: `all ${theme.transitions.fast}`,
      cursor: 'pointer',
      border: 'none',
    },
  }), [theme]);

  return (
    <div style={styles.container} className={className}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>操作日志</span>
        <span style={styles.headerCount}>{logs.length} 条记录</span>
      </div>

      <div style={styles.content}>
        <div style={styles.logList}>
          {logs.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 12 }}>暂无操作记录</span>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={styles.logItem}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={styles.logTime}>{log.time}</span>
                <span
                  style={{
                    ...styles.statusDot,
                    backgroundColor: STATUS_DOT_COLORS[log.status] || theme.colors.textTertiary,
                  }}
                />
                <span style={styles.logDescription}>{log.description}</span>
              </div>
            ))
          )}
        </div>

        <div style={styles.footer}>
          <button
            onClick={onApprove}
            style={styles.approveButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <Check size={12} />
            批准
          </button>
          <button
            onClick={onRequestChange}
            style={styles.changeButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surfaceSelected;
            }}
          >
            <RefreshCw size={12} />
            请求修改
          </button>
          <button
            onClick={onRollback}
            style={styles.rollbackButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
              e.currentTarget.style.color = theme.colors.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.colors.textSecondary;
            }}
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
