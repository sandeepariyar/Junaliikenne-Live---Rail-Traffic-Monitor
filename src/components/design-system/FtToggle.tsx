import React from 'react';

export interface FtToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * ft-toggle: Reusable Design System Component
 * Accessible switch toggle adhering to WCAG 2.2 AA.
 */
export const FtToggle: React.FC<FtToggleProps> = ({
  label,
  checked,
  onChange,
  id,
  icon,
  className = '',
}) => {
  const toggleId = id || `ft-toggle-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label
      htmlFor={toggleId}
      data-component="ft-toggle"
      className={`inline-flex items-center gap-2 cursor-pointer select-none text-xs text-[#F2F5F7] font-medium py-1 px-2 rounded-[6px] hover:bg-[#1C2836] transition-colors ${className}`}
    >
      {icon && <span className="text-[#9BA9B8]" aria-hidden="true">{icon}</span>}
      <span className="text-[#F2F5F7]">{label}</span>
      <button
        type="button"
        role="switch"
        id={toggleId}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA3FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B] ${
          checked ? 'bg-[#4DA3FF]' : 'bg-[#243444] !border-[#8A9AAB]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
};
