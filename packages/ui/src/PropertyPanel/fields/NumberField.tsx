import React, { useMemo } from 'react';
import { useTheme } from '@block-canvas/theme';

export interface NumberFieldProps {
  label?: string;
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
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
    input: {
      height: 30,
      width: '100%',
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surfaceHover,
      padding: '0 8px',
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
      <input
        type="number"
        style={styles.input}
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') {
            onChange(0);
          } else {
            onChange(Number(v));
          }
        }}
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
  );
};
