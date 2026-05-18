import React, { useState } from 'react';
import { inputStyles } from '../../shared/styles';

export interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  style,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ ...inputStyles.fieldGroup, ...style }}>
      {label && <label style={inputStyles.label}>{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
