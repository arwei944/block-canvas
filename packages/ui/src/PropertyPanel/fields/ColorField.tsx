import React, { useMemo } from 'react';
import { useTheme } from '@block-canvas/theme';

export interface ColorFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const ColorField: React.FC<ColorFieldProps> = ({
  label,
  value,
  onChange,
  disabled,
  className = '',
}) => {
  const theme = useTheme();

  const styles = useMemo(() => ({
    container: {
      marginBottom: 12,
      opacity: disabled ? 0.5 : 1,
    },
    label: {
      marginBottom: 4,
      display: 'block',
      fontSize: 12,
      fontWeight: 500,
      color: theme.colors.textSecondary,
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    colorInput: {
      height: 30,
      width: 30,
      cursor: disabled ? 'not-allowed' : 'pointer',
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: 'transparent',
      padding: 2,
    },
    textInput: {
      height: 30,
      flex: 1,
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surfaceHover,
      padding: '0 8px',
      fontFamily: 'monospace',
      fontSize: 13,
      color: theme.colors.textPrimary,
      outline: 'none',
      transition: `border-color ${theme.transitions.fast}`,
      cursor: disabled ? 'not-allowed' : 'text',
    },
  }), [disabled, theme]);

  return (
    <div style={styles.container} className={className}>
      {label && <label style={styles.label}>{label}</label>}
      <div style={styles.row}>
        <input
          type="color"
          style={styles.colorInput}
          value={value || '#000000'}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          style={styles.textInput}
          value={value}
          placeholder="#000000"
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            if (!disabled) {
              e.target.style.borderColor = theme.colors.primary;
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.colors.border;
          }}
        />
      </div>
    </div>
  );
};
