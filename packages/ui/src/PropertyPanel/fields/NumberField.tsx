import React from 'react';

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
}) => (
  <div className={`mb-3 ${disabled ? 'opacity-50' : ''} ${className}`}>
    {label && <label className="mb-1 block text-xs font-medium text-zinc-400">{label}</label>}
    <input
      type="number"
      className="h-[30px] w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500 disabled:cursor-not-allowed"
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
    />
  </div>
);
