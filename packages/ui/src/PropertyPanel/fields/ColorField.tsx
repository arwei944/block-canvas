import React, { useState } from 'react';
import { colorFieldStyles, inputStyles } from '../../shared/styles';

export interface ColorFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const ColorField: React.FC<ColorFieldProps> = ({
  label,
  value,
  onChange,
  disabled,
  style,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ ...inputStyles.fieldGroup, ...style }}>
      {label && <label style={inputStyles.label}>{label}</label>}
      <div style={colorFieldStyles.wrapper}>
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            ...colorFieldStyles.colorInput,
            ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="#000000"
          disabled={disabled}
          style={{
            ...colorFieldStyles.colorText,
            ...(focused ? inputStyles.focus : {}),
            ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
          }}
        />
      </div>
    </div>
  );
};
