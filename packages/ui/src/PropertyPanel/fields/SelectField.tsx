import React from 'react';

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
}) => (
  <div className={`mb-3 ${disabled ? 'opacity-50' : ''} ${className}`}>
    {label && <label className="mb-1 block text-xs font-medium text-zinc-400">{label}</label>}
    <select
      className="h-[30px] w-full appearance-none rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500 disabled:cursor-not-allowed"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
