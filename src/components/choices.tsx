'use client';
import { Check } from 'lucide-react';
export function Choice({
  checked,
  label,
  onChange,
  name,
  value,
  type = 'radio',
  disabled = false,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
  name: string;
  value: string;
  type?: 'radio' | 'checkbox';
  disabled?: boolean;
}) {
  return (
    <label className={`choice ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}>
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className={`choice-indicator ${type}`} aria-hidden="true">
        {checked && <Check size={12} />}
      </span>
      <span>{label}</span>
    </label>
  );
}
