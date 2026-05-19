import React from 'react';

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
}) => (
  <div className={`mb-3 ${disabled ? 'opacity-50' : ''} ${className}`}>
    {label && <label className="mb-1 block text-xs font-medium text-zinc-400">{label}</label>}
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="h-[30px] w-[30px] cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5 disabled:cursor-not-allowed"
        value={value || '#000000'}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        className="h-[30px] flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 font-mono text-[13px] text-zinc-200 outline-none transition-colors focus:border-blue-500 disabled:cursor-not-allowed"
        value={value}
        placeholder="#000000"
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);
