import React, { useMemo } from 'react';
import { useTheme } from '@block-canvas/theme';

export interface SelectFieldOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  disabled?: boolean;
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
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
    select: {
      height: 30,
      width: '100%',
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surfaceHover,
      padding: '0 8px',
      fontSize: 13,
      color: theme.colors.textPrimary,
      outline: 'none',
      appearance: 'none' as const,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: `border-color ${theme.transitions.fast}`,
    },
  }), [disabled, theme]);

  return (
    <div style={styles.container} className={className}>
      {label && <label style={styles.label}>{label}</label>}
      <select
        style={styles.select}
        value={value}
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
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
