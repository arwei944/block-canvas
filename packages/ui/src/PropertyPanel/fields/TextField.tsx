import React from 'react';

export interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  className = '',
}) => (
  <div className={`mb-3 ${disabled ? 'opacity-50' : ''} ${className}`}>
    {label && <label className="mb-1 block text-xs font-medium text-zinc-400">{label}</label>}
    <input
      className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500 disabled:cursor-not-allowed"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
