import React from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface FtSegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * ft-segmented-control: Reusable Design System Component
 * Functional segmented button control for mode switches (e.g. 2D vs 3D Elävä kartta).
 */
export function FtSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  ariaLabel = 'Valitse karttanäkymä',
}: FtSegmentedControlProps<T>) {
  // Radio group keyboard pattern: arrows move selection, one tab stop
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = options.findIndex((o) => o.value === value);
    let n = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % options.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + options.length) % options.length;
    if (n < 0) return;
    e.preventDefault();
    onChange(options[n].value);
    const btns = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    btns[n]?.focus();
  };

  return (
    <div
      role="radiogroup"
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      data-component="ft-segmented-control"
      className={`inline-flex items-center p-0.5 rounded-[8px] bg-[#111822] border border-[#243444] ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[6px] transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA3FF] ${
              isSelected
                ? 'bg-[#1C2836] text-[#F2F5F7] shadow-sm border border-[#354a5e]/50 font-semibold'
                : 'text-[#9BA9B8] hover:text-[#F2F5F7] hover:bg-[#16202A]'
            }`}
          >
            <span aria-hidden="true">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
