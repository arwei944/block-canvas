import React, { useState } from 'react';
import { selectStyles, inputStyles } from '../../shared/styles';

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
  style?: React.CSSProperties;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  disabled,
  style,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ ...inputStyles.fieldGroup, ...style }}>
      {label && <label style={inputStyles.label}>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        style={{
          ...selectStyles.base,
          ...(focused ? inputStyles.focus : {}),
          ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
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
