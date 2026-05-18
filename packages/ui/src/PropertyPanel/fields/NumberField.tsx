import React, { useState } from 'react';
import { inputStyles } from '../../shared/styles';

export interface NumberFieldProps {
  label?: string;
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
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
  style,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ ...inputStyles.fieldGroup, ...style }}>
      {label && <label style={inputStyles.label}>{label}</label>}
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') {
            onChange(0);
          } else {
            onChange(Number(v));
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          ...inputStyles.base,
          ...(focused ? inputStyles.focus : {}),
          ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        }}
      />
    </div>
  );
};
